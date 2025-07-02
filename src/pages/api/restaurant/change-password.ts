import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Methode nicht erlaubt' });
  }

  const supabase = createClient({ req, res });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'Neues Passwort ist erforderlich' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'Das neue Passwort muss eine Zeichenkette mit mindestens 8 Zeichen sein' });
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Supabase-Fehler beim Ändern des Passworts:', error);
      return res.status(400).json({ message: error.message || 'Fehler beim Ändern des Passworts.' });
    }

    return res.status(200).json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('Unerwarteter Fehler beim Ändern des Passworts:', error);
    return res.status(500).json({ message: 'Interner Serverfehler' });
  }
}
