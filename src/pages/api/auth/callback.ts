import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Diese Route sollte nur mit POST-Anfragen aufgerufen werden
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Überprüfen des API-Schlüssels für Sicherheit
    const authHeader = req.headers.authorization;
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event, table, record, old_record } = req.body;

    // Auf Benutzerregistrierungen reagieren
    if (event === 'INSERT' && table === 'profiles') {
      const userId = record.id;
      
      // Admin-Client erstellen
      const adminSupabase = createAdminClient();
      
      // Benutzerinformationen abrufen
      const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user:', userError);
        return res.status(500).json({ error: `Error fetching user: ${userError.message}` });
      }
      
      if (!userData || !userData.user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userRole = userData.user.user_metadata?.role || record.role;
      const userEmail = userData.user.email;
      const userName = record.name || record.firstName || '';
      
      // Nur für Benutzer mit der Rolle "customer" fortfahren
      if (userRole === 'CUSTOMER') {
        // Willkommens-E-Mail senden
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`
          },
          body: JSON.stringify({
            userId,
            email: userEmail,
            name: userName
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to send welcome email:', errorData);
        } else {
          console.log('Welcome email sent successfully for user:', userId);
        }
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in auth callback:', error);
    return res.status(500).json({ 
      error: `Error in auth callback: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
