import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, type RestaurantImage } from '@prisma/client';
import formidable from 'formidable';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { createReadStream } from 'fs';
import { createClient } from '@/utils/supabase/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Disable the default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabase = createClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB Limit
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const restaurantIdField = fields.restaurantId;
    const restaurantId = Array.isArray(restaurantIdField) ? restaurantIdField[0] : restaurantIdField;

    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        images: { select: { id: true } },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.userId !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fileArray = files.images;
    if (!fileArray) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const uploadedImages: RestaurantImage[] = [];
    const errors = [];

    for (const file of Array.isArray(fileArray) ? fileArray : [fileArray]) {
      try {
        const uploadResult = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `contact-tables/restaurants/${restaurantId}`,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          createReadStream(file.filepath).pipe(uploadStream);
        });

        if (!uploadResult) {
          errors.push(`Failed to upload ${file.originalFilename}`);
          continue;
        }

        const isFirstImage: boolean = restaurant.images.length === 0 && uploadedImages.length === 0;
        const shouldSetAsPrimary = isFirstImage || !restaurant.imageUrl;

        const image = await prisma.restaurantImage.create({
          data: {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            restaurantId,
            isPrimary: shouldSetAsPrimary,
          },
        });

        if (shouldSetAsPrimary) {
          await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { imageUrl: uploadResult.secure_url },
          });
        }

        uploadedImages.push(image);
      } catch (error) {
        console.error('Image upload error:', error);
        errors.push(`Error uploading ${file.originalFilename}`);
      }
    }

    if (uploadedImages.length === 0) {
      return res.status(500).json({ 
        message: 'Could not upload any images.',
        errors,
      });
    }

    return res.status(200).json({ 
      message: `${uploadedImages.length} images uploaded successfully.`,
      images: uploadedImages,
      errors,
    });

  } catch (error) {
    console.error('Form parsing error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
