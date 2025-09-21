import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface ApiResponse {
  ok: boolean;
  message: string;
  data?: EmailTemplate[];
}

// Supabase-Konfiguration
const supabaseUrl = 'https://efmbzrmroyetcqxcwxka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcyOTM0OCwiZXhwIjoyMDYzMzA1MzQ4fQ.ahZPlrKH2QHiQTr_qrrhRnYkGMhYnRdD8Zdxn6r5k-4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelle sicherstellen
async function ensureTable() {
  try {
    // Prüfe, ob Tabelle existiert
    const { error } = await supabase.from('email_templates').select('count').single();

    if (error?.code === '42P01') {
      console.log('Tabelle email_templates existiert nicht, erstelle sie...');

      // Erstelle die Tabelle
      const { error: createError } = await supabase.rpc('create_email_templates_if_not_exists');

      if (createError) {
        console.log('RPC fehlgeschlagen, versuche direktes SQL...');

        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.email_templates (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              subject TEXT NOT NULL,
              content TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW(),
              created_by TEXT DEFAULT 'system'
            );
          `
        });

        if (sqlError) {
          console.error('Tabelle konnte nicht erstellt werden:', sqlError);
          throw sqlError;
        }
      }

      console.log('Tabelle erfolgreich erstellt');
    }
  } catch (error) {
    console.error('Fehler bei ensureTable:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    console.log('Templates API:', req.method);

    // Tabelle sicherstellen
    await ensureTable();

    if (req.method === 'GET') {
      // Alle Vorlagen abrufen
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GET Fehler:', error);
        return res.status(500).json({
          ok: false,
          message: `Datenbankfehler: ${error.message}`
        });
      }

      console.log(`${data?.length || 0} Vorlagen gefunden`);

      return res.status(200).json({
        ok: true,
        message: 'Vorlagen geladen',
        data: data || []
      });

    } else if (req.method === 'POST') {
      const { name, subject, content } = req.body;

      if (!name || !subject || !content) {
        return res.status(400).json({
          ok: false,
          message: 'Name, subject und content sind erforderlich'
        });
      }

      console.log('Speichere Vorlage:', name);

      const { data, error } = await supabase
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
        console.error('POST Fehler:', error);
        return res.status(500).json({
          ok: false,
          message: `Speichern fehlgeschlagen: ${error.message}`
        });
      }

      console.log('Vorlage gespeichert:', data.id);

      return res.status(201).json({
        ok: true,
        message: 'Vorlage gespeichert',
        data: [data]
      });

    } else if (req.method === 'PUT') {
      const { id, name, subject, content } = req.body;

      if (!id || !name || !subject || !content) {
        return res.status(400).json({
          ok: false,
          message: 'ID, name, subject und content sind erforderlich'
        });
      }

      const { data, error } = await supabase
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
        console.error('PUT Fehler:', error);
        return res.status(500).json({
          ok: false,
          message: `Aktualisierung fehlgeschlagen: ${error.message}`
        });
      }

      return res.status(200).json({
        ok: true,
        message: 'Vorlage aktualisiert',
        data: [data]
      });

    } else {
      return res.status(405).json({
        ok: false,
        message: 'Methode nicht erlaubt'
      });
    }

  } catch (error) {
    console.error('API Fehler:', error);
    return res.status(500).json({
      ok: false,
      message: `Interner Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`
    });
  }
}
