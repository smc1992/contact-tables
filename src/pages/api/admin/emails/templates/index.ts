import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  ok: boolean;
  message: string;
  data?: EmailTemplate[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Auth check: only admins may access templates
  const supabase = createClient({ req, res });
  const { data: userData } = await supabase.auth.getUser();
  const currentUser = userData?.user;
  if (!currentUser) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  const role = (currentUser.user_metadata as any)?.role;
  if (role !== 'admin' && role !== 'ADMIN') {
    return res.status(403).json({ ok: false, message: 'Forbidden' });
  }

  const adminSupabase = createAdminClient();

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await adminSupabase
          .from('email_templates')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Templates retrieved successfully', 
          data: data as EmailTemplate[] 
        });
      } catch (error) {
        console.error('Error fetching email templates:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error fetching templates: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    case 'POST':
      try {
        const { name, subject, content } = req.body;
        
        if (!name || !subject || !content) {
          return res.status(400).json({ 
            ok: false, 
            message: 'Missing required fields: name, subject, content' 
          });
        }
        
        const { data, error } = await adminSupabase
          .from('email_templates')
          .insert({ name, subject, content })
          .select()
          .single();
        
        if (error) throw error;
        
        return res.status(201).json({ 
          ok: true, 
          message: 'Template created successfully', 
          data: [data] as EmailTemplate[]
        });
      } catch (error) {
        console.error('Error creating email template:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error creating template: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    default:
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
}
