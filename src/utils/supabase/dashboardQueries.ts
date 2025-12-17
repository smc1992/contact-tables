import { createClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardStats {
  users: number;
  restaurants: number;
  pendingRequests: number;
  activeRestaurants: number;
  recentActivity: ActivityItem[];
  financialStats: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageContractValue: number;
    pendingPayments: number;
  };
  emailStats: {
    totalCampaigns: number;
    totalSent: number;
    recentCampaigns: Array<{
      id: string;
      subject: string;
      recipient_count: number;
      status: string;
      created_at: string;
    }>;
  };
}

export interface ActivityItem {
  type: 'registration' | 'contract' | 'payment';
  restaurant?: string;
  date?: string;
  title?: string;
  description?: string;
  timestamp?: string;
}

/**
 * Lädt alle Dashboard-Daten direkt über Supabase-Queries
 */
export async function fetchDashboardData(supabase: SupabaseClient): Promise<DashboardStats> {
  try {
    // Parallele Abfragen für bessere Performance
    const [
      usersResult,
      restaurantsResult,
      pendingRequestsResult,
      activeRestaurantsResult,
      recentRegistrationsResult,
      recentContractsResult,
      recentPaymentsResult,
      financialStatsResult,
      emailCampaignsCountResult,
      recentEmailCampaignsResult
    ] = await Promise.all([
      // Anzahl der Benutzer
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      
      // Anzahl der Restaurants
      supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      
      // Anzahl der ausstehenden Anfragen
      supabase.from('restaurant_requests').select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Anzahl der aktiven Restaurants
      supabase.from('restaurants').select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Neueste Registrierungen
      supabase.from('restaurants')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Neueste Verträge
      supabase.from('restaurant_contracts')
        .select('restaurants(name), created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Neueste Zahlungen
      supabase.from('payments')
        .select('restaurants(name), created_at, amount')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Finanzstatistiken
      supabase.rpc('get_financial_stats'),
      
      // Anzahl der Email-Kampagnen
      supabase.from('email_campaigns').select('*', { count: 'exact', head: true }),
      
      // Neueste Email-Kampagnen
      supabase.from('email_campaigns')
        .select('id, subject, recipient_count, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Email-Batches
      supabase.from('email_batches')
        .select('id, campaign_id, status, created_at, completed_at')
        .order('created_at', { ascending: true })
    ]);

    // Fehlerbehandlung für jede Abfrage
    if (usersResult.error) throw new Error(`Fehler bei Benutzerabfrage: ${usersResult.error.message}`);
    if (restaurantsResult.error) throw new Error(`Fehler bei Restaurantabfrage: ${restaurantsResult.error.message}`);
    if (pendingRequestsResult.error) throw new Error(`Fehler bei Anfragenabfrage: ${pendingRequestsResult.error.message}`);
    if (activeRestaurantsResult.error) throw new Error(`Fehler bei aktiven Restaurants: ${activeRestaurantsResult.error.message}`);
    if (recentRegistrationsResult.error) throw new Error(`Fehler bei Registrierungen: ${recentRegistrationsResult.error.message}`);
    if (recentContractsResult.error) throw new Error(`Fehler bei Verträgen: ${recentContractsResult.error.message}`);
    if (recentPaymentsResult.error) throw new Error(`Fehler bei Zahlungen: ${recentPaymentsResult.error.message}`);
    if (emailCampaignsCountResult.error) throw new Error(`Fehler bei Email-Kampagnen-Abfrage: ${emailCampaignsCountResult.error.message}`);
    if (recentEmailCampaignsResult.error) throw new Error(`Fehler bei neuesten Email-Kampagnen: ${recentEmailCampaignsResult.error.message}`);
    // Prüfe auf Fehler bei Email-Batches-Abfrage
    const emailBatchesData = await supabase.from('email_batches')
      .select('id, campaign_id, status, created_at, completed_at')
      .order('created_at', { ascending: true });
      
    if (emailBatchesData.error) throw new Error(`Fehler bei Email-Batches: ${emailBatchesData.error.message}`);

    // Aktivitäten zusammenführen und sortieren
    const registrations = recentRegistrationsResult.data || [];
    const contracts = recentContractsResult.data || [];
    const payments = recentPaymentsResult.data || [];

    // Einfache Aktivitätsobjekte erstellen, die nur die erforderlichen Felder enthalten
    const recentActivity = [
      ...registrations.map(reg => ({
        type: 'registration' as const,
        title: `Neue Registrierung`,
        description: `Ein neues Restaurant hat sich registriert`,
        timestamp: new Date().toISOString()
      })),
      ...contracts.map(con => ({
        type: 'contract' as const,
        title: `Neuer Vertrag`,
        description: `Ein neuer Vertrag wurde abgeschlossen`,
        timestamp: new Date().toISOString()
      })),
      ...payments.map(pay => ({
        type: 'payment' as const,
        title: `Neue Zahlung`,
        description: `Eine neue Zahlung ist eingegangen`,
        timestamp: new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
     .slice(0, 10); // Nur die 10 neuesten Aktivitäten

    // Finanzstatistiken
    const financialStats = financialStatsResult.error ? {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    } : financialStatsResult.data || {
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageContractValue: 0,
      pendingPayments: 0
    };

    // Email-Kampagnen-Daten vorbereiten
    const recentEmailCampaigns = recentEmailCampaignsResult.data || [];
    const emailBatches = emailBatchesData.data || [];

    // Email-Kampagnen mit Batch-Informationen anreichern
    const enrichedEmailCampaigns = recentEmailCampaigns.map(campaign => {
      const batches = emailBatches.filter((batch: {campaign_id: string}) => batch.campaign_id === campaign.id);
      return {
        ...campaign,
        batchCount: batches.length,
        hasBatches: batches.length > 0
      };
    });

    // Ergebnis zusammenstellen
    return {
      users: usersResult.count || 0,
      restaurants: restaurantsResult.count || 0,
      pendingRequests: pendingRequestsResult.count || 0,
      activeRestaurants: activeRestaurantsResult.count || 0,
      recentActivity,
      financialStats,
      emailStats: {
        totalCampaigns: emailCampaignsCountResult.count || 0,
        totalSent: enrichedEmailCampaigns.reduce((sum, campaign) => sum + (campaign.recipient_count || 0), 0),
        recentCampaigns: enrichedEmailCampaigns
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden der Dashboard-Daten:', error);
    
    // Fallback zu Dummy-Daten bei Fehler
    return {
      users: 0,
      restaurants: 0,
      pendingRequests: 0,
      activeRestaurants: 0,
      recentActivity: [],
      financialStats: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageContractValue: 0,
        pendingPayments: 0
      },
      emailStats: {
        totalCampaigns: 0,
        totalSent: 0,
        recentCampaigns: []
      }
    };
  }
}

/**
 * Lädt Analytikdaten direkt über Supabase-Queries
 */
export async function fetchAnalyticsData(supabase: SupabaseClient, timeframe = 'month'): Promise<any> {
  try {
    // Parallele Abfragen für bessere Performance
    const [
      userRegistrationsResult,
      restaurantRegistrationsResult,
      revenueResult,
      userTypesResult
    ] = await Promise.all([
      // Benutzerregistrierungen über Zeit
      supabase.rpc('get_user_registrations_over_time', { p_timeframe: timeframe }),
      
      // Restaurantregistrierungen über Zeit
      supabase.rpc('get_restaurant_registrations_over_time', { p_timeframe: timeframe }),
      
      // Einnahmen über Zeit
      supabase.rpc('get_revenue_over_time', { p_timeframe: timeframe }),
      
      // Benutzertypen Verteilung
      supabase.rpc('get_user_types_distribution')
    ]);

    // Fehlerbehandlung
    if (userRegistrationsResult.error) throw new Error(`Fehler bei Benutzerregistrierungen: ${userRegistrationsResult.error.message}`);
    if (restaurantRegistrationsResult.error) throw new Error(`Fehler bei Restaurantregistrierungen: ${restaurantRegistrationsResult.error.message}`);
    if (revenueResult.error) throw new Error(`Fehler bei Einnahmen: ${revenueResult.error.message}`);
    if (userTypesResult.error) throw new Error(`Fehler bei Benutzertypen: ${userTypesResult.error.message}`);

    // Daten formatieren
    return {
      userRegistrations: {
        labels: userRegistrationsResult.data?.map((item: any) => item.date_label) || [],
        data: userRegistrationsResult.data?.map((item: any) => item.count) || []
      },
      restaurantRegistrations: {
        labels: restaurantRegistrationsResult.data?.map((item: any) => item.date_label) || [],
        data: restaurantRegistrationsResult.data?.map((item: any) => item.count) || []
      },
      revenue: {
        labels: revenueResult.data?.map((item: any) => item.date_label) || [],
        data: revenueResult.data?.map((item: any) => item.amount) || []
      },
      userTypes: {
        labels: userTypesResult.data?.map((item: any) => item.role) || [],
        data: userTypesResult.data?.map((item: any) => item.count) || []
      }
    };
  } catch (error) {
    console.error('Fehler beim Laden der Analytikdaten:', error);
    
    // Fallback zu leeren Daten bei Fehler
    return {
      userRegistrations: { labels: [], data: [] },
      restaurantRegistrations: { labels: [], data: [] },
      revenue: { labels: [], data: [] },
      userTypes: { labels: [], data: [] }
    };
  }
}

/**
 * Prüft den Systemstatus direkt über Supabase-Queries
 */
export async function checkSystemStatusDirect(supabase: SupabaseClient): Promise<any> {
  try {
    const startTime = performance.now();
    
    // Einfache Abfrage zur Prüfung der Datenbankverbindung
    const { data, error } = await supabase.from('system_health').select('*').limit(1);
    
    const endTime = performance.now();
    const dbLatency = endTime - startTime;
    
    // API-Status prüfen (Supabase selbst)
    const apiStatus = !error;
    
    // Weitere Statusprüfungen über RPC-Funktionen
    const [paymentSystemResult, emailSystemResult] = await Promise.all([
      supabase.rpc('check_payment_system_health'),
      supabase.rpc('check_email_system_health')
    ]);

    return {
      api: {
        status: apiStatus ? 'operational' : 'down',
        latency: apiStatus ? dbLatency : null
      },
      database: {
        status: !error ? 'operational' : 'down',
        latency: !error ? dbLatency : null
      },
      paymentSystem: {
        status: paymentSystemResult.data ? 'operational' : 'degraded',
        latency: paymentSystemResult.data?.latency || null
      },
      emailSystem: {
        status: emailSystemResult.data ? 'operational' : 'degraded',
        latency: emailSystemResult.data?.latency || null
      }
    };
  } catch (error) {
    console.error('Fehler bei der Systemstatusprüfung:', error);
    
    // Fallback bei Fehler
    return {
      api: { status: 'unknown', latency: null },
      database: { status: 'unknown', latency: null },
      paymentSystem: { status: 'unknown', latency: null },
      emailSystem: { status: 'unknown', latency: null }
    };
  }
}
