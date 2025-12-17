import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { imageId, restaurantId } = req.body;

  if (!imageId || !restaurantId) {
    return res.status(400).json({ message: 'Image ID and Restaurant ID are required' });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { userId: true }
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const userRole = user.user_metadata?.role;
    if (restaurant.userId !== user.id && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const image = await prisma.restaurantImage.findUnique({
      where: { id: imageId }
    });

    if (!image || image.restaurantId !== restaurantId) {
      return res.status(404).json({ message: 'Image not found or does not belong to this restaurant' });
    }

    if (image.url) {
      try {
        const publicIdMatch = image.url.match(/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.restaurantImage.delete({ where: { id: imageId } });

      if (image.isPrimary) {
        const nextImage = await tx.restaurantImage.findFirst({
          where: { restaurantId },
          orderBy: { id: 'desc' }
        });

        if (nextImage) {
          await tx.restaurantImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true }
          });
          await tx.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: nextImage.url }
          });
        } else {
          await tx.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: null }
          });
        }
      }
    });

    return res.status(200).json({ message: 'Image successfully deleted' });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
