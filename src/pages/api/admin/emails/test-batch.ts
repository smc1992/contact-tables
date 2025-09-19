import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from './withAdminAuth';

interface TestBatchResponse {
  ok: boolean;
  message: string;
  batchId?: string;
  result?: any;
}

/**
 * Test-Endpunkt zum manuellen Auslösen der Batch-Verarbeitung
 * Nur für Administratoren zugänglich
 */
async function handler(req: NextApiRequest, res: NextApiResponse<TestBatchResponse>, userId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    console.log('Manueller Test der Batch-Verarbeitung gestartet...');
    const { batchId } = req.body;

    if (!batchId) {
      console.log('Kein Batch-ID angegeben, rufe den Cron-Job-Endpunkt auf...');
      
      // Rufe den Cron-Job-Endpunkt auf
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret) {
        return res.status(500).json({ ok: false, message: 'CRON_SECRET ist nicht konfiguriert' });
      }

      const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/cron/process-email-batches`;
      
      console.log(`Rufe API-Endpunkt auf: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`
        }
      });

      console.log(`API-Antwort erhalten: Status ${response.status}`);
      
      const result = await response.json();
      
      return res.status(response.status).json({
        ok: response.ok,
        message: result.message || 'Cron-Job-Endpunkt aufgerufen',
        result
      });
    } else {
      console.log(`Verarbeite Batch mit ID ${batchId}...`);
      
      // Rufe den Batch-Prozessor direkt auf
      const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/admin/emails/process-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify({ batchId })
      });

      console.log(`Batch-Prozessor-Antwort erhalten: Status ${response.status}`);
      
      const result = await response.json();
      
      return res.status(response.status).json({
        ok: response.ok,
        message: result.message || 'Batch-Verarbeitung abgeschlossen',
        batchId,
        result
      });
    }
  } catch (error) {
    console.error('Fehler beim Testen der Batch-Verarbeitung:', error);
    return res.status(500).json({
      ok: false,
      message: `Fehler beim Testen der Batch-Verarbeitung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
    });
  }
}

export default withAdminAuth(handler);
