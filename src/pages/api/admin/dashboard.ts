import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { withAdminAuth } from '../middleware/withAdminAuth';
import { PostgrestError } from '@supabase/supabase-js';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Benutzer ist bereits durch withAdminAuth authentifiziert und autorisiert

    // Admin-Client für privilegierte Abfragen erstellen
    const adminClient = createAdminClient();
    
    // Statistiken abrufen - Alle Benutzer aus auth.users zählen
    // Diese Abfrage gibt die gleiche Anzahl wie in der Supabase UI zurück
    const { count: usersCount, error: usersError } = await adminClient
      .from('auth.users')
      .select('*', { count: 'exact', head: true });
      
    const { data: restaurantsData, error: restaurantsError } = await adminClient
      .from('restaurants')
      .select('*', { count: 'exact', head: true });
      
    const { data: pendingRequestsData, error: pendingRequestsError } = await adminClient
      .from('partner_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
      
    const { data: activeRestaurantsData, error: activeRestaurantsError } = await adminClient
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    // Neueste Aktivitäten abrufen
    const { data: recentRegistrations } = await adminClient
      .from('restaurants')
      .select('name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Email-Statistiken abrufen
    const { data: emailCampaigns, error: emailCampaignsError } = await adminClient
      .from('email_campaigns')
      .select('id, created_at, status');
    
    const { data: emailRecipients, error: emailRecipientsError } = await adminClient
      .from('email_recipients')
      .select('id, status, campaign_id');
    
    // Email-Statistiken berechnen
    let totalCampaigns = 0;
    let totalSent = 0;
    let recentCampaigns = [];
    
    if (!emailCampaignsError && emailCampaigns) {
      totalCampaigns = emailCampaigns.length;
      
      // Die neuesten 5 Kampagnen abrufen
      const sortedCampaigns = [...emailCampaigns].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5);
      
      // Details für die neuesten Kampagnen abrufen
      for (const campaign of sortedCampaigns) {
        const { data: campaignDetails } = await adminClient
          .from('email_campaigns')
          .select('id, subject, created_at, status')
          .eq('id', campaign.id)
          .single();
          
        if (campaignDetails) {
          const recipients = emailRecipients?.filter(r => r.campaign_id === campaign.id) || [];
          recentCampaigns.push({
            id: campaignDetails.id,
            subject: campaignDetails.subject,
            recipient_count: recipients.length,
            status: campaignDetails.status,
            created_at: campaignDetails.created_at
          });
        }
      }
    }
    
    if (!emailRecipientsError && emailRecipients) {
      totalSent = emailRecipients.filter(r => r.status === 'sent' || r.status === 'opened').length;
    }
    
    // Email-Statistiken zusammenfassen
    const emailStats = {
      totalCampaigns,
      totalSent,
      recentCampaigns
    };
    
    // Finanzstatistiken von der financial-statistics API abrufen
    let financialStats = {
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    };
    
    try {
      // Erstelle eine interne API-Anfrage an die financial-statistics Route
      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/financial-statistics`;
      const response = await fetch(apiUrl, {
        headers: {
          // Übertrage die Auth-Cookies für die interne API-Anfrage
          cookie: req.headers.cookie || ''
        }
      });
      
      if (response.ok) {
        const financialData = await response.json();
        
        // Extrahiere die relevanten Daten für das Dashboard
        financialStats = {
          monthlyRevenue: financialData.revenueThisMonth || 0,
          yearlyRevenue: financialData.totalRevenue || 0,
          averageContractValue: financialData.averageOrderValue || 0,
          pendingPayments: financialData.pendingPayments || 0
        };
      } else {
        console.error('Fehler beim Abrufen der Finanzstatistiken:', response.statusText);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Finanzstatistiken:', error);
      // Bei Fehler bleiben die Standardwerte (0) erhalten
    }
    
    return res.status(200).json({
      stats: {
        users: usersCount || 0,
        restaurants: restaurantsData?.length || 0,
        pendingRequests: pendingRequestsData?.length || 0,
        activeRestaurants: activeRestaurantsData?.length || 0,
        financialStats,
        emailStats,
        recentActivity: recentRegistrations?.map(item => ({
          type: 'registration',
          restaurant: item.name,
          date: item.created_at
        })) || []
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Fehler:', error);
    return res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
  }
}

// Export the handler with admin authentication
export default withAdminAuth(handler);