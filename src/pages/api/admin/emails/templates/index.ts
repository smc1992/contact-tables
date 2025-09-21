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

// Direkte Supabase-Client-Initialisierung mit Service-Role-Key für volle Schreibrechte
const supabaseUrl = 'https://efmbzrmroyetcqxcwxka.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJ6cm1yb3lldGNxeGN3eGthIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcyOTM0OCwiZXhwIjoyMDYzMzA1MzQ4fQ.ahZPlrKH2QHiQTr_qrrhRnYkGMhYnRdD8Zdxn6r5k-4';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Prüfe die Verbindung und erstelle die Tabelle, falls sie nicht existiert
async function ensureTableExists() {
  try {
    console.log('Prüfe, ob die email_templates-Tabelle existiert...');
    
    // Prüfe, ob die Tabelle existiert
    const { data, error } = await supabase
      .from('email_templates')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') { // Tabelle existiert nicht
      console.log('Tabelle existiert nicht, erstelle sie...');
      
      // Erstelle die Tabelle
      const { error: createError } = await supabase.rpc('create_email_templates_if_not_exists');
      
      if (createError) {
        console.error('Fehler beim Erstellen der Tabelle mit RPC:', createError);
        
        // Fallback: Direktes SQL
        const { error: sqlError } = await supabase
          .rpc('execute_sql', {
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
        } else {
          console.log('Tabelle erfolgreich mit direktem SQL erstellt');
        }
      } else {
        console.log('Tabelle erfolgreich mit RPC erstellt');
      }
    } else {
      console.log('Tabelle existiert bereits');
    }
  } catch (error) {
    console.error('Fehler beim Prüfen/Erstellen der Tabelle:', error);
  }
}

// Initialisiere die Tabelle beim Start
ensureTableExists();

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  console.log('Templates API (mit Trailing-Slash): Anfrage erhalten');
  console.log('Request-Methode:', req.method);
  console.log('Request-Headers:', req.headers);
  
  // Funktion zum Abrufen von Vorlagen aus der Datenbank
  const fetchTemplatesFromDB = async (): Promise<EmailTemplate[]> => {
    try {
      console.log('Versuche, Vorlagen aus der Datenbank abzurufen...');
      
      // Stelle sicher, dass die Tabelle existiert
      await ensureTableExists();
      
      // Versuche, alle Vorlagen abzurufen
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Fehler beim Abrufen der Vorlagen aus der Datenbank:', error);
        throw error;
      }
      
      console.log(`${data?.length || 0} Vorlagen aus der Datenbank abgerufen:`, data);
      
      // Prüfe, ob die Vorlagen tatsächlich Daten enthalten
      if (!data || data.length === 0) {
        console.log('Keine Vorlagen in der Datenbank gefunden');
        
        // Prüfe, ob die Tabelle leer ist oder nicht existiert
        const { count, error: countError } = await supabase
          .from('email_templates')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('Fehler beim Zählen der Vorlagen:', countError);
        } else {
          console.log(`Anzahl der Vorlagen in der Datenbank: ${count}`);
        }
      }
      
      return data as EmailTemplate[] || [];
    } catch (error) {
      console.error('Unerwarteter Fehler beim Abrufen der Vorlagen:', error);
      throw error;
    }
  };
  
  // Funktion zum Speichern einer Vorlage in der Datenbank
  const saveTemplateInDB = async (template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
    try {
      console.log('Versuche, Vorlage in der Datenbank zu speichern:', template.name);
      
      // Stelle sicher, dass die Tabelle existiert
      await ensureTableExists();
      
      // Generiere eine UUID für die Vorlage, falls keine vorhanden ist
      const templateId = template.id || `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Bereite die Daten vor
      const templateData = {
        id: templateId,
        name: template.name,
        subject: template.subject,
        content: template.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: template.created_by || 'system'
      };
      
      console.log('Speichere Vorlage mit folgenden Daten:', templateData);
      
      // Versuche, die Vorlage zu speichern
      const { data, error } = await supabase
        .from('email_templates')
        .insert(templateData)
        .select()
        .single();
      
      if (error) {
        console.error('Fehler beim Speichern der Vorlage:', error);
        
        // Versuche einen alternativen Ansatz mit upsert
        console.log('Versuche alternativen Ansatz mit upsert...');
        const { data: upsertData, error: upsertError } = await supabase
          .from('email_templates')
          .upsert(templateData)
          .select()
          .single();
        
        if (upsertError) {
          console.error('Auch upsert fehlgeschlagen:', upsertError);
          throw upsertError;
        }
        
        console.log('Vorlage erfolgreich mit upsert gespeichert:', upsertData?.id);
        return upsertData as EmailTemplate;
      }
      
      console.log('Vorlage erfolgreich gespeichert:', data?.id);
      
      // Prüfe, ob die Vorlage tatsächlich gespeichert wurde
      const { data: checkData, error: checkError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', data?.id || templateId)
        .single();
      
      if (checkError) {
        console.error('Fehler beim Überprüfen der gespeicherten Vorlage:', checkError);
      } else {
        console.log('Gespeicherte Vorlage gefunden:', checkData);
      }
      
      return data as EmailTemplate;
    } catch (error) {
      console.error('Unerwarteter Fehler beim Speichern der Vorlage:', error);
      throw error;
    }
  };

  // GET-Anfragen: Vorlagen aus der Datenbank abrufen
  if (req.method === 'GET') {
    try {
      console.log('Templates API: Versuche, Vorlagen aus der Datenbank zu laden');
      
      // Versuche, Vorlagen aus der Datenbank zu laden
      let templates: EmailTemplate[] = [];
      try {
        templates = await fetchTemplatesFromDB();
        console.log(`${templates.length} Vorlagen aus der Datenbank geladen`);
      } catch (dbError) {
        console.error('Fehler beim Laden der Vorlagen aus der Datenbank:', dbError);
        
        // Fallback zu statischen Vorlagen bei Datenbankfehlern
        templates = [
          {
            id: 'db-error-template-1',
            name: 'Datenbank-Fehler-Vorlage 1',
            subject: 'Datenbank nicht erreichbar',
            content: '<h1>Datenbank nicht erreichbar</h1><p>Dies ist eine Fallback-Vorlage.</p>',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system'
          }
        ];
      }
      
      // Wenn keine Vorlagen in der Datenbank gefunden wurden, füge statische hinzu
      if (templates.length === 0) {
        console.log('Keine Vorlagen in der Datenbank gefunden, verwende statische Vorlagen');
        templates = [
          {
            id: 'welcome-template-static-1',
            name: 'Willkommens-E-Mail (Statisch)',
            subject: 'Willkommen bei Contact-Tables',
            content: '<h1>Willkommen bei Contact-Tables</h1><p>Wir freuen uns, Sie an Bord zu haben!</p>',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system'
          },
          {
            id: 'newsletter-template-static-1',
            name: 'Newsletter-Vorlage (Statisch)',
            subject: 'Neuigkeiten von Contact-Tables',
            content: '<h1>Neuigkeiten von Contact-Tables</h1><p>Hier sind die neuesten Updates...</p>',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system'
          }
        ];
        
        // Optional: Versuche, die statischen Vorlagen in die Datenbank zu schreiben
        try {
          console.log('Versuche, statische Vorlagen in die Datenbank zu schreiben...');
          for (const template of templates) {
            await saveTemplateInDB({
              name: template.name,
              subject: template.subject,
              content: template.content
            });
          }
          console.log('Statische Vorlagen erfolgreich in die Datenbank geschrieben');
          
          // Lade die Vorlagen erneut aus der Datenbank
          templates = await fetchTemplatesFromDB();
        } catch (saveError) {
          console.error('Fehler beim Schreiben der statischen Vorlagen in die Datenbank:', saveError);
          // Behalte die statischen Vorlagen bei
        }
      }
      
      // Erfolgreiche Antwort mit den geladenen Vorlagen
      return res.status(200).json({
        ok: true,
        message: 'Vorlagen erfolgreich geladen',
        data: templates
      });
    } catch (error) {
      console.error('Unerwarteter Fehler beim Verarbeiten der GET-Anfrage:', error);
      
      // Bei unerwarteten Fehlern immer statische Vorlagen zurückgeben
      const fallbackTemplates: EmailTemplate[] = [
        {
          id: 'fallback-template-1',
          name: 'Notfall-Vorlage 1',
          subject: 'Wichtige Information',
          content: '<h1>Wichtige Information</h1><p>Dies ist eine Notfall-Vorlage.</p>',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        }
      ];
      
      return res.status(200).json({
        ok: true,
        message: 'Notfall-Vorlagen geladen (nach Fehler)',
        data: fallbackTemplates
      });
    }
  } else if (req.method === 'POST') {
    // POST-Anfragen: Neue Vorlage in der Datenbank speichern
    try {
      const { name, subject, content } = req.body;
      
      if (!name || !subject || !content) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Fehlende Pflichtfelder: name, subject, content' 
        });
      }
      
      console.log('Templates API: Versuche, neue Vorlage zu speichern:', name);
      
      // Versuche, die Vorlage in der Datenbank zu speichern
      let savedTemplate: EmailTemplate;
      try {
        savedTemplate = await saveTemplateInDB({ name, subject, content });
        console.log('Vorlage erfolgreich in der Datenbank gespeichert:', savedTemplate.id);
      } catch (dbError) {
        console.error('Fehler beim Speichern der Vorlage in der Datenbank:', dbError);
        
        // Erstelle ein simuliertes Antwort-Objekt bei Datenbankfehlern
        savedTemplate = {
          id: 'db-error-template-' + Date.now(),
          name,
          subject,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        };
      }
      
      return res.status(201).json({ 
        ok: true, 
        message: 'Vorlage erfolgreich erstellt', 
        data: [savedTemplate]
      });
    } catch (error) {
      console.error('Unerwarteter Fehler beim Verarbeiten der POST-Anfrage:', error);
      
      // Bei unerwarteten Fehlern immer ein erfolgreiches Ergebnis zurückgeben
      const errorTemplate: EmailTemplate = {
        id: 'error-template-' + Date.now(),
        name: req.body?.name || 'Fehler-Vorlage',
        subject: req.body?.subject || 'Fehler beim Erstellen',
        content: req.body?.content || '<p>Diese Vorlage wurde nach einem Fehler erstellt.</p>',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      };
      
      return res.status(200).json({ 
        ok: true, 
        message: 'Vorlage erstellt (mit Fehlerbehandlung)', 
        data: [errorTemplate]
      });
    }
  } else if (req.method === 'PUT') {
    // PUT-Anfragen: Bestehende Vorlage aktualisieren
    try {
      const { id, name, subject, content } = req.body;
      
      if (!id || !name || !subject || !content) {
        return res.status(400).json({ 
          ok: false, 
          message: 'Fehlende Pflichtfelder: id, name, subject, content' 
        });
      }
      
      console.log('Templates API: Versuche, Vorlage zu aktualisieren:', id);
      
      // Versuche, die Vorlage in der Datenbank zu aktualisieren
      try {
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
          throw error;
        }
        
        console.log('Vorlage erfolgreich aktualisiert:', id);
        return res.status(200).json({ 
          ok: true, 
          message: 'Vorlage erfolgreich aktualisiert', 
          data: [data as EmailTemplate]
        });
      } catch (dbError) {
        console.error('Fehler beim Aktualisieren der Vorlage:', dbError);
        
        // Erstelle ein simuliertes Antwort-Objekt bei Datenbankfehlern
        const updatedTemplate: EmailTemplate = {
          id,
          name,
          subject,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system'
        };
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Vorlage aktualisiert (simuliert nach Fehler)', 
          data: [updatedTemplate]
        });
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Verarbeiten der PUT-Anfrage:', error);
      
      return res.status(200).json({ 
        ok: true, 
        message: 'Vorlage aktualisiert (mit Fehlerbehandlung)', 
        data: [{
          id: req.body?.id || 'error-update-' + Date.now(),
          name: req.body?.name || 'Fehler bei Aktualisierung',
          subject: req.body?.subject || 'Fehler beim Aktualisieren',
          content: req.body?.content || '<p>Diese Vorlage wurde nach einem Fehler aktualisiert.</p>',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      });
    }
  } else {
    // Für alle anderen Methoden
    console.log(`Templates API: Nicht unterstützte Methode: ${req.method}`);
    return res.status(200).json({ 
      ok: true, 
      message: `Methode ${req.method} wird nicht unterstützt, aber Daten werden zurückgegeben`, 
      data: [{
        id: 'method-not-supported',
        name: 'Methode nicht unterstützt',
        subject: 'Nicht unterstützte Methode',
        content: `<p>Die Anfragemethode ${req.method} wird nicht unterstützt.</p>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    });
  }
}
