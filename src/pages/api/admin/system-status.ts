import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../middleware/withAdminAuth';
import nodemailer from 'nodemailer';

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Supabase-Client erstellen
    const supabase = createClient({ req, res });
    
    // Benutzer ist bereits durch withAdminAuth authentifiziert und autorisiert

    // Aktuelle Systemstatus-Daten abrufen oder initialisieren
    let systemStatus = {
      api: { status: 'checking', latency: 0, last_checked: new Date().toISOString() },
      database: { status: 'checking', latency: 0, last_checked: new Date().toISOString() },
      payment: { status: 'checking', latency: 0, last_checked: new Date().toISOString() },
      email: { status: 'checking', latency: 0, last_checked: new Date().toISOString() }
    };
    
    // Systemstatus aus der Datenbank abrufen (für historische Daten)
    const { data: systemStatusData, error: systemStatusError } = await supabase
      .from('system_status')
      .select('*');

    if (!systemStatusError && systemStatusData) {
      // Status-Daten formatieren
      const statusMap = systemStatusData.reduce((acc: any, item: any) => {
        acc[item.service] = {
          status: item.status,
          latency: item.latency || 0,
          last_checked: item.last_checked
        };
        return acc;
      }, {});
      
      // Historische Daten in den aktuellen Status übernehmen
      if (statusMap.payment) systemStatus.payment = statusMap.payment;
      if (statusMap.email) systemStatus.email = statusMap.email;
    }

    // 1. API und Datenbank-Status prüfen
    const apiDbStartTime = performance.now();
    const { data: healthCheck, error: healthCheckError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);
    const apiDbEndTime = performance.now();
    const apiDbLatency = Math.round(apiDbEndTime - apiDbStartTime);
    
    // API und Datenbank-Status aktualisieren
    systemStatus.api = {
      status: healthCheckError ? 'degraded' : 'online',
      latency: apiDbLatency,
      last_checked: new Date().toISOString()
    };
    
    systemStatus.database = {
      status: healthCheckError ? 'degraded' : 'online',
      latency: apiDbLatency,
      last_checked: new Date().toISOString()
    };
    
    // 2. Email-System prüfen
    try {
      const emailStartTime = performance.now();
      
      // SMTP-Einstellungen aus der Datenbank abrufen
      const { data: smtpSettings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'smtp_settings')
        .single();
      
      if (smtpSettings?.value) {
        const settings = typeof smtpSettings.value === 'string' 
          ? JSON.parse(smtpSettings.value)
          : smtpSettings.value;
        
        // SMTP-Verbindung testen
        const transporter = nodemailer.createTransport({
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          auth: {
            user: settings.user,
            pass: settings.password
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        
        // Verbindung prüfen ohne E-Mail zu senden
        await transporter.verify();
        
        const emailEndTime = performance.now();
        const emailLatency = Math.round(emailEndTime - emailStartTime);
        
        systemStatus.email = {
          status: 'online',
          latency: emailLatency,
          last_checked: new Date().toISOString()
        };
      } else {
        systemStatus.email = {
          status: 'not_configured',
          latency: 0,
          last_checked: new Date().toISOString()
        };
      }
    } catch (emailError) {
      console.error('Email-System-Check fehlgeschlagen:', emailError);
      systemStatus.email = {
        status: 'offline',
        latency: 0,
        last_checked: new Date().toISOString()
      };
    }
    
    // 3. Zahlungssystem prüfen
    try {
      const paymentStartTime = performance.now();
      
      // Zahlungssystem-Einstellungen aus der Datenbank abrufen
      const { data: paymentSettings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'payment_settings')
        .single();
      
      if (paymentSettings?.value) {
        const settings = typeof paymentSettings.value === 'string'
          ? JSON.parse(paymentSettings.value)
          : paymentSettings.value;
        
        // API-Endpunkt des Zahlungsanbieters prüfen
        // Hier könnte ein echter API-Aufruf an Stripe, PayPal etc. erfolgen
        const paymentProviderUrl = settings.api_url || 'https://api.stripe.com/v1/balance';
        
        const paymentResponse = await fetch(paymentProviderUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${settings.api_key || 'test_key'}`,
            'Content-Type': 'application/json'
          }
        });
        
        const paymentEndTime = performance.now();
        const paymentLatency = Math.round(paymentEndTime - paymentStartTime);
        
        systemStatus.payment = {
          status: paymentResponse.ok ? 'online' : 'degraded',
          latency: paymentLatency,
          last_checked: new Date().toISOString()
        };
      } else {
        systemStatus.payment = {
          status: 'not_configured',
          latency: 0,
          last_checked: new Date().toISOString()
        };
      }
    } catch (paymentError) {
      console.error('Zahlungssystem-Check fehlgeschlagen:', paymentError);
      systemStatus.payment = {
        status: 'offline',
        latency: 0,
        last_checked: new Date().toISOString()
      };
    }
    
    // 4. Systemstatus in der Datenbank aktualisieren
    try {
      // Prüfen, ob die system_status Tabelle existiert
      const { count } = await supabase
        .from('information_schema.tables')
        .select('*', { count: 'exact', head: true })
        .eq('table_schema', 'public')
        .eq('table_name', 'system_status');
      
      if (count && count > 0) {
        // Für jeden Service den Status aktualisieren
        for (const [service, status] of Object.entries(systemStatus)) {
          await supabase
            .from('system_status')
            .upsert({
              service,
              status: status.status,
              latency: status.latency,
              last_checked: status.last_checked
            }, {
              onConflict: 'service'
            });
        }
      }
    } catch (dbUpdateError) {
      console.error('Fehler beim Aktualisieren des Systemstatus in der Datenbank:', dbUpdateError);
      // Fehler beim Aktualisieren der Datenbank beeinträchtigt nicht die Rückgabe des aktuellen Status
    }

    // Status zurückgeben
    return res.status(200).json(systemStatus);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);
