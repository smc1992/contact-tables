import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const prisma = new PrismaClient();

// Initialize Supabase Admin client for admin actions
const supabaseAdmin = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { restaurantId } = req.body;
  const userIdToDelete = user.id; // The user requesting deletion

  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        userId: true,
        images: {
          select: {
            id: true,
            url: true // Corrected from publicId to url
          }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const userRole = user.user_metadata?.role;
    // Authorization: only the restaurant owner or an admin can delete
    if (restaurant.userId !== userIdToDelete && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const authUserIdToDelete = restaurant.userId;

    await prisma.$transaction(async (tx) => {
      for (const image of restaurant.images) {
        if (image.url) {
          try {
            const publicIdMatch = image.url.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
            const publicId = publicIdMatch ? publicIdMatch[1] : null;
            
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (cloudinaryError) {
            console.error('Error deleting image from Cloudinary:', cloudinaryError);
          }
        }
      }
      
      await tx.restaurantImage.deleteMany({ where: { restaurantId } });
      await tx.contract.deleteMany({ where: { restaurantId } });
      await tx.invoice.deleteMany({ where: { restaurantId } });
      await tx.restaurant.delete({ where: { id: restaurantId } });
    });

    const { error: supabaseUserDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserIdToDelete);
    if (supabaseUserDeleteError) {
        console.error(`Failed to delete Supabase user ${authUserIdToDelete}:`, supabaseUserDeleteError.message);
        return res.status(500).json({ message: 'Restaurant data deleted, but failed to delete the user account. Please contact support.' });
    }

    return res.status(200).json({ message: 'Restaurant account and all associated data successfully deleted' });
  } catch (error: any) {
    console.error('Error deleting restaurant account:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
      await prisma.$disconnect();
  }
}
