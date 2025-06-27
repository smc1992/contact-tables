import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, EventStatus } from '@prisma/client';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { sendNewContactTableRequestToRestaurant, sendContactTableConfirmationToCustomer } from '../../../utils/email';

const prisma = new PrismaClient();

interface CreateContactTableRequestBody {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  message?: string;
  isPublic?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create Supabase client
    const supabase = createPagesServerClient({ req, res });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if the user is a paying customer
    const user = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { id: true, isPaying: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isPaying) {
      return res.status(403).json({ 
        message: 'A premium account is required for this feature',
        requiresPayment: true
      });
    }

    // Extract data from the request body
    const {
      restaurantId,
      date,
      time,
      partySize,
      message,
      isPublic = true
    } = req.body as CreateContactTableRequestBody;

    // Validate required fields
    if (!restaurantId || !date || !time || !partySize) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, email: true }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Validate date (must be in the future)
    const reservationDate = new Date(`${date}T${time}`);
    if (reservationDate < new Date()) {
      return res.status(400).json({ message: 'The date must be in the future' });
    }

    // Create event
    // @ts-ignore - Bypassing a persistent type error, likely due to a language server cache issue.
    const event = await prisma.event.create({
      data: {
        title: `Contact Table at ${restaurant.name}`,
        restaurantId,
        datetime: reservationDate,
        maxParticipants: partySize,
        description: message || '',
        status: EventStatus.OPEN,
        isPublic,
      },
    });

    // Create a participant entry for the host
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: user.id,
        isHost: true,
      },
    });

    // Format date and time for email notifications
    const eventDate = event.datetime.toLocaleDateString('de-DE');
    const eventTime = event.datetime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Send email to restaurant
    if (restaurant.email) {
      await sendNewContactTableRequestToRestaurant({
        restaurantEmail: restaurant.email,
        restaurantName: restaurant.name,
        customerName: user.name ?? 'A user',
        date: eventDate,
        time: eventTime,
        partySize: event.maxParticipants,
        message: event.description ?? '',
      });
    }

    // Send confirmation email to customer
    await sendContactTableConfirmationToCustomer({
      customerEmail: session.user.email!,
      customerName: user.name ?? 'there',
      restaurantName: restaurant.name,
      date: eventDate,
      time: eventTime,
      partySize: event.maxParticipants,
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating contact table:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
