import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '../../../utils/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
  }

  // Verwendet die zentrale, wiederverwendbare Funktion, um einen konsistenten Supabase-Client zu erstellen.
  // Dies stellt sicher, dass die Cookie-Handhabung mit der Middleware und den getServerSideProps-Funktionen identisch ist.
  const supabase = createClient({ req, res });

  // Führt den Login direkt über den Supabase-Authentifizierungsdienst durch.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase Login-Fehler:', error.message);
    return res.status(error.status || 401).json({ message: error.message || 'Ungültige Anmeldeinformationen' });
  }

  // Der Supabase-Client (via createClient) hat das Session-Cookie bereits automatisch im Response-Header gesetzt.
  // Wir geben die Benutzer- und Sitzungsdaten an das Frontend zurück.
  return res.status(200).json({
    message: 'Login erfolgreich',
    user: data.user,
    session: data.session,
  });
}
 