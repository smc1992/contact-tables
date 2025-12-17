import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs/promises';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Supabase Admin Client for Storage operations
const supabaseAdmin = createSupabaseAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient({ req, res });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { userId: user.id },
  });

  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found for this user.' });
  }

  if (req.method === 'GET') {
    try {
      const documents = await prisma.document.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'POST') {
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      const fileContent = await fs.readFile(uploadedFile.filepath);
      const fileName = `${user.id}/${restaurant.id}/${Date.now()}-${uploadedFile.originalFilename}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('documents') // Make sure this bucket exists and has correct policies
        .upload(fileName, fileContent, {
          contentType: uploadedFile.mimetype || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      const newDocument = await prisma.document.create({
        data: {
          title: uploadedFile.originalFilename || 'Untitled Document',
          url: publicUrl,
          storagePath: uploadData.path,
          fileType: uploadedFile.mimetype || 'unknown',
          fileSize: uploadedFile.size,
          restaurantId: restaurant.id,
        },
      });

      return res.status(201).json(newDocument);
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ error: 'Failed to upload document.' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Document ID is required.' });
    }

    try {
        const docToDelete = await prisma.document.findFirst({
            where: { id: id, restaurantId: restaurant.id },
        });

        if (!docToDelete) {
            return res.status(404).json({ error: 'Document not found or you do not have permission to delete it.' });
        }

        // Delete from storage
        const { error: storageError } = await supabaseAdmin.storage
            .from('documents')
            .remove([docToDelete.storagePath]);

        if (storageError) {
            console.error('Error deleting from storage, but proceeding to delete from DB:', storageError);
        }

        // Delete from database
        await prisma.document.delete({ where: { id: docToDelete.id } });

        return res.status(200).json({ message: 'Document deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
