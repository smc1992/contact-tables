import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS-Header für lokale Entwicklung
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentifizierungsendpunkt
  if (req.method === 'POST') {
    const { action, email, password, userData } = req.body;

    try {
      switch (action) {
        case 'signUp':
          // Registrierung
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                ...userData,
                role: userData?.role || 'CUSTOMER',
              },
            },
          });

          if (signUpError) throw signUpError;
          return res.status(200).json({ user: signUpData.user, session: signUpData.session });

        case 'signIn':
          // Anmeldung
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;
          return res.status(200).json({ user: signInData.user, session: signInData.session });

        case 'signOut':
          // Abmeldung
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
          return res.status(200).json({ message: 'Erfolgreich abgemeldet' });

        case 'resetPassword':
          // Passwort zurücksetzen
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
          });
          if (resetError) throw resetError;
          return res.status(200).json({ message: 'E-Mail zum Zurücksetzen des Passworts gesendet' });

        default:
          return res.status(400).json({ error: 'Ungültige Aktion' });
      }
    } catch (error: any) {
      console.error('Authentifizierungsfehler:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Benutzerinformationen abrufen
  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Nicht authentifiziert' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Token validieren und Benutzerinformationen abrufen
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) throw error;
      
      return res.status(200).json({ user: data.user });
    } catch (error: any) {
      console.error('Fehler beim Abrufen der Benutzerinformationen:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Methode nicht erlaubt
  return res.status(405).json({ error: 'Methode nicht erlaubt' });
}
