import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Disable Next.js body parser for this route to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to promisify formidable parsing
const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});
        form.parse(req, (err, fields, files) => {
            if (err) {
                return reject(err);
            }
            resolve({ fields, files });
        });
    });
};

// Main handler for POST /api/restaurant/upload-images
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name: string) => req.cookies[name],
            set: () => {},
            remove: () => {},
          },
          cookieOptions: {
            name: 'contact-tables-auth',
          },
        }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
        const { fields, files } = await parseForm(req);

        const restaurantId = Array.isArray(fields.restaurantId) ? fields.restaurantId[0] : fields.restaurantId;
        const imageFiles = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];

        if (!restaurantId) {
            return res.status(400).json({ message: 'Restaurant ID is missing' });
        }
        if (imageFiles.length === 0) {
            return res.status(400).json({ message: 'No files were uploaded' });
        }
        
        // 1. Verify user owns the restaurant
        const { data: owner, error: ownerError } = await supabaseAdmin
            .from('restaurants')
            .select('userId')
            .eq('id', restaurantId)
            .eq('userId', user.id)
            .single();

        if (ownerError || !owner) {
            return res.status(403).json({ message: 'Permission denied. You do not own this restaurant.' });
        }

        const uploadedImages = [];

        // 2. Process each uploaded file
        for (const file of imageFiles) {
            const fileContent = fs.readFileSync(file.filepath);
            const fileId = uuidv4();
            const filePath = `${restaurantId}/${fileId}`;

            // 3. Upload to Supabase Storage
            const { error: uploadError } = await supabaseAdmin.storage
                .from('restaurant-images')
                .upload(filePath, fileContent, {
                    contentType: file.mimetype || 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Storage upload failed for file ${file.originalFilename}: ${uploadError.message}`);
            }

            // 4. Get public URL
            const { data: publicUrlData } = supabaseAdmin.storage
                .from('restaurant-images')
                .getPublicUrl(filePath);

            // 5. Insert record into the database
            const { data: newImage, error: dbError } = await supabaseAdmin
                .from('restaurant_images')
                .insert({
                    id: fileId,
                    public_id: fileId,
                    restaurant_id: restaurantId,
                    url: publicUrlData.publicUrl,
                    is_primary: false, // New images are never primary by default
                })
                .select()
                .single();

            if (dbError) {
                 // Attempt to clean up storage if DB insert fails
                await supabaseAdmin.storage.from('restaurant-images').remove([filePath]);
                throw new Error(`Database insert failed for file ${file.originalFilename}: ${dbError.message}`);
            }
            uploadedImages.push(newImage);
        }

        return res.status(200).json(uploadedImages);

    } catch (error: any) {
        console.error('Image upload process failed:', error);
        return res.status(500).json({ message: 'Image upload process failed.', error: error.message });
    }
}
