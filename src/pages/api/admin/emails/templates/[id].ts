import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { withAdminAuth } from '@/pages/api/middleware/withAdminAuth';

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
  data?: EmailTemplate;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>, userId: string) {
  // Auth is already checked by withAdminAuth middleware
  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Clients:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Fehler bei der Serververbindung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    });
  }
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ ok: false, message: 'Invalid template ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      try {
        const { data, error } = await adminSupabase
          .from('email_templates')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') { // No rows returned
            return res.status(404).json({ ok: false, message: 'Template not found' });
          }
          throw error;
        }
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Template retrieved successfully', 
          data: data as EmailTemplate 
        });
      } catch (error) {
        console.error('Error fetching email template:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error fetching template: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    case 'PUT':
      try {
        const { name, subject, content } = req.body;
        
        if (!name || !subject || !content) {
          return res.status(400).json({ 
            ok: false, 
            message: 'Missing required fields: name, subject, content' 
          });
        }
        
        // Prüfe zuerst, ob die Vorlage existiert
        const { data: existingTemplate, error: checkError } = await adminSupabase
          .from('email_templates')
          .select('id')
          .eq('id', id)
          .single();
        
        if (checkError) {
          console.error('Fehler beim Prüfen der Vorlage:', checkError);
          
          if (checkError.code === 'PGRST116') { // No rows returned
            return res.status(404).json({ ok: false, message: 'Template not found' });
          }
          
          throw checkError;
        }
        
        if (!existingTemplate) {
          return res.status(404).json({ ok: false, message: 'Template not found' });
        }
        
        // Aktualisiere die Vorlage
        const { data, error } = await adminSupabase
          .from('email_templates')
          .update({ 
            name, 
            subject, 
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Fehler beim Aktualisieren der Vorlage:', error);
          throw error;
        }
        
        if (!data) {
          return res.status(404).json({ ok: false, message: 'Template not found after update' });
        }
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Template updated successfully', 
          data: data as EmailTemplate
        });
      } catch (error) {
        console.error('Error updating email template:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error updating template: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    case 'DELETE':
      try {
        // Prüfe zuerst, ob die Vorlage existiert
        const { data: existingTemplate, error: checkError } = await adminSupabase
          .from('email_templates')
          .select('id')
          .eq('id', id)
          .single();
        
        if (checkError) {
          console.error('Fehler beim Prüfen der Vorlage:', checkError);
          
          if (checkError.code === 'PGRST116') { // No rows returned
            return res.status(404).json({ ok: false, message: 'Template not found' });
          }
          
          throw checkError;
        }
        
        if (!existingTemplate) {
          return res.status(404).json({ ok: false, message: 'Template not found' });
        }
        
        // Lösche die Vorlage
        const { error } = await adminSupabase
          .from('email_templates')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Fehler beim Löschen der Vorlage:', error);
          throw error;
        }
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Template deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting email template:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error deleting template: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    default:
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
