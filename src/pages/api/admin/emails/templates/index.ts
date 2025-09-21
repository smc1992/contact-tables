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

// Supabase-Konfiguration - Verwende RPC-Funktionen um RLS zu umgehen
const supabaseUrl = 'https://efmbzrmroyetcqxcwxka.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcyOTM0OCwiZXhwIjoyMDYzMzA1MzQ4fQ.ahZPlrKH2QHiQTr_qrrhRnYkGMhYnRdD8Zdxn6r5k-4';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    console.log('Templates API:', req.method);

    if (req.method === 'GET') {
      // Verwende RPC um RLS zu umgehen
      const { data, error } = await supabase.rpc('get_email_templates');

      if (error) {
        console.error('GET RPC Fehler:', error);
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

      // Verwende RPC um RLS zu umgehen
      const { data, error } = await supabase.rpc('insert_email_template', {
        template_name: name,
        template_subject: subject,
        template_content: content
      });

      if (error) {
        console.error('POST RPC Fehler:', error);
        return res.status(500).json({
          ok: false,
          message: `Speichern fehlgeschlagen: ${error.message}`
        });
      }

      console.log('Vorlage gespeichert:', data?.[0]?.id);
      return res.status(201).json({
        ok: true,
        message: 'Vorlage gespeichert',
        data: data
      });

    } else if (req.method === 'PUT') {
      const { id, name, subject, content } = req.body;

      if (!id || !name || !subject || !content) {
        return res.status(400).json({
          ok: false,
          message: 'ID, name, subject und content sind erforderlich'
        });
      }

      // Verwende RPC um RLS zu umgehen
      const { data, error } = await supabase.rpc('update_email_template', {
        template_id: id,
        template_name: name,
        template_subject: subject,
        template_content: content
      });

      if (error) {
        console.error('PUT RPC Fehler:', error);
        return res.status(500).json({
          ok: false,
          message: `Aktualisierung fehlgeschlagen: ${error.message}`
        });
      }

      return res.status(200).json({
        ok: true,
        message: 'Vorlage aktualisiert',
        data: data
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
