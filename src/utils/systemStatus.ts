import { createClient } from './supabase/client';

export interface SystemStatus {
  api: {
    status: 'online' | 'degraded' | 'offline';
    latency: number; // in ms
  };
  database: {
    status: 'online' | 'degraded' | 'offline';
    latency: number; // in ms
  };
  payment: {
    status: 'online' | 'degraded' | 'offline';
  };
  email: {
    status: 'online' | 'degraded' | 'offline';
  };
}

export async function checkSystemStatus(): Promise<SystemStatus> {
  const supabase = createClient();
  const status: SystemStatus = {
    api: { status: 'offline', latency: 0 },
    database: { status: 'offline', latency: 0 },
    payment: { status: 'offline' },
    email: { status: 'offline' }
  };

  // API-Status prüfen
  const apiStart = performance.now();
  try {
    const { data: healthCheck, error } = await supabase.from('health_check').select('*').limit(1);
    const apiEnd = performance.now();
    const latency = apiEnd - apiStart;
    
    if (error) {
      status.api.status = 'degraded';
      console.error('API Status degraded:', error);
    } else {
      status.api.status = 'online';
      status.api.latency = Math.round(latency);
    }
  } catch (error) {
    console.error('API Status check failed:', error);
  }

  // Datenbank-Status prüfen
  const dbStart = performance.now();
  try {
    const { data, error } = await supabase.rpc('check_database_health');
    const dbEnd = performance.now();
    const latency = dbEnd - dbStart;
    
    if (error) {
      status.database.status = 'degraded';
      console.error('Database Status degraded:', error);
    } else {
      status.database.status = 'online';
      status.database.latency = Math.round(latency);
    }
  } catch (error) {
    console.error('Database Status check failed:', error);
  }

  // Zahlungssystem-Status prüfen
  try {
    const { data, error } = await supabase.from('system_status').select('*').eq('service', 'payment').single();
    
    if (error || !data) {
      status.payment.status = 'degraded';
    } else {
      status.payment.status = data.status as 'online' | 'degraded' | 'offline';
    }
  } catch (error) {
    console.error('Payment system status check failed:', error);
  }

  // E-Mail-Dienst-Status prüfen
  try {
    const { data, error } = await supabase.from('system_status').select('*').eq('service', 'email').single();
    
    if (error || !data) {
      status.email.status = 'degraded';
    } else {
      status.email.status = data.status as 'online' | 'degraded' | 'offline';
    }
  } catch (error) {
    console.error('Email service status check failed:', error);
  }

  return status;
}
