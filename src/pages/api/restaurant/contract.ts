import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { restaurantId, acceptedTerms } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
  }

  if (!acceptedTerms) {
    return res.status(400).json({ message: 'Die Nutzungsbedingungen müssen akzeptiert werden' });
  }

  try {
    // Find the restaurant and its owner
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant nicht gefunden' });
    }

    // Authorization check: User must be the restaurant owner or an admin
    const userRole = user.user_metadata?.role;
    if (restaurant.userId !== user.id && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    // Check if an active or pending contract already exists
    const existingContract = await prisma.contract.findFirst({
      where: {
        restaurantId: restaurantId,
        status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING] }
      }
    });

    if (existingContract) {
      return res.status(400).json({ message: 'Es existiert bereits ein aktiver oder ausstehender Vertrag für dieses Restaurant' });
    }

    // Create a new contract record
    const contract = await prisma.contract.create({
      data: {
        restaurantId: restaurantId,
        status: ContractStatus.PENDING, // Status is pending until payment
        startDate: new Date(),
      }
    });

    // Update the restaurant's status as well
    await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
            contractStatus: ContractStatus.PENDING,
            contractAcceptedAt: new Date(),
        }
    });

    return res.status(200).json({ 
      message: 'Vertrag erfolgreich erstellt und wartet auf Bestätigung.',
      contractId: contract.id
    });
  } catch (error) {
    console.error('Fehler bei der Vertragserstellung:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  } finally {
    await prisma.$disconnect();
  }
}
