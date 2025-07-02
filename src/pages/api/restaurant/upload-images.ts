import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server'; // Correct import
import { supabaseAdmin } from '../../../lib/supabaseClient';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Create a logger that writes to a file
const logFilePath = path.join(process.cwd(), 'upload-debug.log');
const log = (message: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    fs.appendFileSync(logFilePath, `${timestamp}: ${logMessage}\n`, 'utf8');
};

// Promisify formidable
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

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Clear log file for new request for easier debugging
    if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
    }
    
    log(`API Route /api/restaurant/upload-images called, Method: ${req.method}`);

    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', ['POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

        log('Creating Supabase server client using shared utility...');
        const supabase = createClient({ req, res }); // Correct initialization
        
        log('Getting user from Supabase...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            log({ message: 'Authentication error', error: userError });
            return res.status(401).json({ message: 'Authentication failed' });
        }
        log(`User authenticated: ${user.id}`);

        log('Parsing form data...');
        const { fields, files } = await parseForm(req);

        const restaurantId = Array.isArray(fields.restaurantId) ? fields.restaurantId[0] : fields.restaurantId;
        const imageFiles = files.images ? (Array.isArray(files.images) ? files.images : [files.images]) : [];

        log({ message: '--- Image Upload Request ---', restaurantId, fileCount: imageFiles.length });
        
        if (!restaurantId) {
            log('Validation failed: Restaurant ID is missing.');
            return res.status(400).json({ message: 'Restaurant ID is missing' });
        }
        if (imageFiles.length === 0) {
            log('Validation failed: No files were uploaded.');
            return res.status(400).json({ message: 'No files were uploaded' });
        }
        
        log('Verifying restaurant ownership...');
        // Use the user-context client to respect RLS
        const { data: restaurant, error: ownerError } = await supabase
            .from('restaurants')
            .select('id')
            .eq('id', restaurantId)
            .single();

        if (ownerError || !restaurant) {
            log({ message: 'Ownership verification failed', error: ownerError });
            return res.status(403).json({ message: 'Permission denied. You do not own this restaurant or it does not exist.' });
        }
        log('Ownership verified.');

        const uploadedImages = [];
        
        for (const file of imageFiles) {
            log(`Processing file: ${file.originalFilename}`);
            const fileContent = fs.readFileSync(file.filepath);
            const fileId = uuidv4();
            const filePath = `${restaurantId}/${fileId}`;

            log(`Uploading ${file.originalFilename} to Supabase Storage at path: ${filePath}`);
            // Use the admin client for storage operations that bypass RLS
            const { error: uploadError } = await supabaseAdmin.storage
                .from('restaurant-bilder')
                .upload(filePath, fileContent, {
                    contentType: file.mimetype || 'image/jpeg',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(`Storage upload failed for file ${file.originalFilename}: ${uploadError.message}`);
            }
            log('Upload to storage successful.');

            log('Getting public URL...');
            const { data: publicUrlData } = supabaseAdmin.storage
                .from('restaurant-bilder')
                .getPublicUrl(filePath);
            log(`Public URL: ${publicUrlData.publicUrl}`);

            log('Inserting DB record...');
            const { data: newImage, error: dbError } = await supabaseAdmin
                .from('restaurant_images')
                .insert({
                    id: fileId,
                    public_id: fileId,
                    restaurant_id: restaurantId,
                    url: publicUrlData.publicUrl,
                    is_primary: false,
                })
                .select()
                .single();

            if (dbError) {
                log('Database insert failed. Attempting to remove uploaded file from storage...');
                await supabaseAdmin.storage.from('restaurant-bilder').remove([filePath]);
                throw new Error(`Database insert failed for file ${file.originalFilename}: ${dbError.message}`);
            }
            log('DB insert successful.');
            uploadedImages.push(newImage);
        }

        log('Image upload process completed successfully.');
        return res.status(200).json(uploadedImages);

    } catch (error: any) {
        log(`--- UNHANDLED ERROR IN IMAGE UPLOAD ---`);
        log(`Error Message: ${error.message}`);
        log(`Error Stack: ${error.stack}`);
        return res.status(500).json({ 
            message: 'An unexpected error occurred. Check the debug log.', 
            error: { message: error.message, stack: error.stack }
        });
    }
}
