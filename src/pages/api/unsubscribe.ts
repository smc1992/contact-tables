import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

interface UnsubscribeResponse {
  ok: boolean;
  message: string;
  email?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UnsubscribeResponse>) {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ ok: false, message: 'Ungültiger Abmelde-Token' });
  }

  try {
    const adminSupabase = createAdminClient();
    
    // Find recipient by unsubscribe token
    const { data: recipient, error } = await adminSupabase
      .from('email_recipients')
      .select('recipient_email, recipient_id')
      .eq('unsubscribe_token', token)
      .single();
    
    if (error || !recipient) {
      return res.status(404).json({ ok: false, message: 'Ungültiger oder abgelaufener Abmelde-Link' });
    }
    
    // Add email to unsubscribe list
    await adminSupabase
      .from('unsubscribed_emails')
      .upsert({
        email: recipient.recipient_email,
        user_id: recipient.recipient_id,
        unsubscribed_at: new Date().toISOString()
      });
    
    return res.status(200).json({ 
      ok: true, 
      message: 'Sie wurden erfolgreich von unserem Newsletter abgemeldet',
      email: recipient.recipient_email
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' 
    });
  }
}
