import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
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
  data?: EmailTemplate[];
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

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      try {
        // Prüfe zuerst, ob die Tabelle existiert
        const { data: tablesData, error: tablesError } = await adminSupabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'email_templates')
          .eq('table_schema', 'public');
        
        if (tablesError) {
          console.error('Fehler beim Prüfen der Tabelle:', tablesError);
          throw new Error('Fehler beim Prüfen der Datenbanktabellen');
        }
        
        // Wenn die Tabelle nicht existiert, erstelle sie
        if (!tablesData || tablesData.length === 0) {
          console.log('Tabelle email_templates existiert nicht, erstelle sie...');
          
          const { error: createError } = await adminSupabase.rpc('create_email_templates_if_not_exists');
          
          if (createError) {
            console.error('Fehler beim Erstellen der Tabelle:', createError);
            
            // Fallback: Erstelle die Tabelle direkt mit SQL
            const { error: sqlError } = await adminSupabase.rpc('execute_sql', {
              sql: `
                CREATE TABLE IF NOT EXISTS public.email_templates (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  name TEXT NOT NULL,
                  subject TEXT NOT NULL,
                  content TEXT NOT NULL,
                  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
              `
            });
            
            if (sqlError) {
              console.error('Fehler beim direkten Erstellen der Tabelle:', sqlError);
              throw new Error('Konnte die erforderliche Tabelle nicht erstellen');
            }
          }
        }
        
        // Jetzt hole die Vorlagen
        const { data, error } = await adminSupabase
          .from('email_templates')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Fehler beim Abrufen der Vorlagen:', error);
          throw error;
        }
        
        // Wenn keine Vorlagen vorhanden sind, erstelle eine Beispielvorlage
        if (!data || data.length === 0) {
          console.log('Keine Vorlagen gefunden, erstelle Beispielvorlage...');
          
          const { error: insertError } = await adminSupabase
            .from('email_templates')
            .insert({
              name: 'Willkommens-E-Mail',
              subject: 'Willkommen bei Contact Tables',
              content: '<h1>Willkommen bei Contact Tables!</h1><p>Vielen Dank für Ihre Registrierung.</p>'
            });
          
          if (insertError) {
            console.error('Fehler beim Erstellen der Beispielvorlage:', insertError);
          } else {
            // Hole die Vorlagen erneut
            const { data: newData, error: newError } = await adminSupabase
              .from('email_templates')
              .select('*')
              .order('name');
            
            if (!newError && newData) {
              return res.status(200).json({ 
                ok: true, 
                message: 'Beispielvorlage erstellt', 
                data: newData as EmailTemplate[] 
              });
            }
          }
        }
        
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
        
        // Prüfe zuerst, ob die Tabelle existiert
        const { data: tablesData, error: tablesError } = await adminSupabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', 'email_templates')
          .eq('table_schema', 'public');
        
        if (tablesError) {
          console.error('Fehler beim Prüfen der Tabelle:', tablesError);
          throw new Error('Fehler beim Prüfen der Datenbanktabellen');
        }
        
        // Wenn die Tabelle nicht existiert, erstelle sie
        if (!tablesData || tablesData.length === 0) {
          console.log('Tabelle email_templates existiert nicht, erstelle sie...');
          
          try {
            await adminSupabase.rpc('create_email_templates_if_not_exists');
          } catch (createError) {
            console.error('Fehler beim Erstellen der Tabelle:', createError);
            
            // Fallback: Erstelle die Tabelle direkt mit SQL
            try {
              await adminSupabase.rpc('execute_sql', {
                sql: `
                  CREATE TABLE IF NOT EXISTS public.email_templates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                  );
                `
              });
            } catch (sqlError) {
              console.error('Fehler beim direkten Erstellen der Tabelle:', sqlError);
              throw new Error('Konnte die erforderliche Tabelle nicht erstellen');
            }
          }
        }
        
        // Jetzt füge die neue Vorlage ein
        const { data, error } = await adminSupabase
          .from('email_templates')
          .insert({ 
            name, 
            subject, 
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          console.error('Fehler beim Erstellen der Vorlage:', error);
          throw error;
        }
        
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

// Export the handler with admin authentication
export default withAdminAuth(handler);
