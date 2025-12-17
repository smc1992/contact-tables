import { Handler } from '@netlify/functions';
import { PrismaClient } from '@prisma/client';
import { createAdminClient } from '../../src/utils/supabase/server';

const prisma = new PrismaClient();

// Diese Funktion wird regelmäßig von einem Netlify-Cron-Job aufgerufen
// Konfiguration in netlify.toml:
// [functions.campaign-scheduler]
// schedule = "*/15 * * * *"  # Alle 15 Minuten

const handler: Handler = async (event) => {
  // Sicherheitscheck: Nur Cron-Aufrufe oder mit Admin-Token erlauben
  const isCronTrigger = event.headers['x-netlify-event'] === 'schedule';
  const isAdminRequest = event.headers['x-admin-token'] === process.env.ADMIN_API_TOKEN;
  
  if (!isCronTrigger && !isAdminRequest) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    console.log('Campaign Scheduler gestartet:', new Date().toISOString());
    
    // 1. Einmalige geplante Kampagnen abrufen, die jetzt gestartet werden sollen
    const scheduledCampaigns = await prisma.email_campaigns.findMany({
      where: {
        status: 'scheduled',
        schedule_type: 'scheduled',
        scheduled_at: {
          lte: new Date()
        }
      }
    });
    
    console.log(`${scheduledCampaigns.length} geplante Kampagnen gefunden`);
    
    // 2. Wiederkehrende Kampagnen abrufen
    const recurringCampaigns = await prisma.email_campaigns.findMany({
      where: {
        status: 'active',
        schedule_type: 'recurring'
      }
    });
    
    console.log(`${recurringCampaigns.length} wiederkehrende Kampagnen gefunden`);
    
    // 3. Wiederkehrende Kampagnen filtern, die jetzt ausgeführt werden sollen
    const recurringCampaignsToRun = recurringCampaigns.filter(campaign => {
      return shouldRunRecurringCampaign(campaign);
    });
    
    console.log(`${recurringCampaignsToRun.length} wiederkehrende Kampagnen werden ausgeführt`);
    
    // 4. Alle zu startenden Kampagnen zusammenfassen
    const campaignsToProcess = [
      ...scheduledCampaigns,
      ...recurringCampaignsToRun
    ];
    
    // 5. Kampagnen verarbeiten
    const results = [];
    for (const campaign of campaignsToProcess) {
      try {
        // Batch erstellen
        const batch = await prisma.email_batches.create({
          data: {
            campaign_id: campaign.id,
            status: 'pending'
          }
        });
        
        // Einmalige Kampagnen auf 'active' setzen
        if (campaign.schedule_type === 'scheduled') {
          await prisma.email_campaigns.update({
            where: { id: campaign.id },
            data: { status: 'active' }
          });
        }
        
        // Batch-Verarbeitung starten
        const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://contact-tables.org';
        const response = await fetch(`${siteUrl}/api/admin/emails/process-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': process.env.ADMIN_API_TOKEN || ''
          },
          body: JSON.stringify({ batch_id: batch.id })
        });
        
        const result = await response.json();
        results.push({
          campaign_id: campaign.id,
          batch_id: batch.id,
          success: response.ok,
          result
        });
      } catch (error) {
        console.error(`Fehler bei Kampagne ${campaign.id}:`, error);
        results.push({
          campaign_id: campaign.id,
          success: false,
          error: (error as Error).message
        });
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: campaignsToProcess.length,
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Campaign Scheduler Fehler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: (error as Error).message })
    };
  }
};

// Hilfsfunktion zur Prüfung, ob eine wiederkehrende Kampagne jetzt ausgeführt werden soll
function shouldRunRecurringCampaign(campaign: any): boolean {
  const now = new Date();
  
  try {
    // Konfiguration aus JSON parsen
    const config = typeof campaign.recurring_config === 'string' 
      ? JSON.parse(campaign.recurring_config) 
      : campaign.recurring_config;
    
    if (!config) return false;
    
    // Prüfen, ob das Startdatum erreicht wurde
    if (config.start_date && new Date(config.start_date) > now) {
      return false;
    }
    
    // Prüfen, ob das Enddatum überschritten wurde
    if (config.end_date && new Date(config.end_date) < now) {
      return false;
    }
    
    // Tägliche Kampagnen
    if (config.frequency === 'daily') {
      return isTimeToRun(now, config.time);
    }
    
    // Wöchentliche Kampagnen
    if (config.frequency === 'weekly' && Array.isArray(config.days)) {
      const dayOfWeek = now.getDay(); // 0 = Sonntag, 1 = Montag, ...
      return config.days.includes(dayOfWeek) && isTimeToRun(now, config.time);
    }
    
    // Monatliche Kampagnen
    if (config.frequency === 'monthly' && Array.isArray(config.days)) {
      const dayOfMonth = now.getDate(); // 1-31
      return config.days.includes(dayOfMonth) && isTimeToRun(now, config.time);
    }
    
    return false;
  } catch (error) {
    console.error(`Fehler bei der Prüfung der wiederkehrenden Kampagne ${campaign.id}:`, error);
    return false;
  }
}

// Prüft, ob die aktuelle Zeit mit der geplanten Zeit übereinstimmt (±5 Minuten)
function isTimeToRun(now: Date, scheduledTime?: string): boolean {
  if (!scheduledTime) return true;
  
  try {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    const diffMs = Math.abs(now.getTime() - scheduledDate.getTime());
    const diffMinutes = diffMs / (1000 * 60);
    
    // Innerhalb von 5 Minuten zum geplanten Zeitpunkt
    return diffMinutes <= 5;
  } catch (error) {
    console.error('Fehler bei der Zeitprüfung:', error);
    return false;
  }
}

export { handler };
