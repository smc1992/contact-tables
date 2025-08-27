import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createAdminClient } from '@/utils/supabase/server';

const ensureAdmin = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = createClient({ req, res });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return null;
  }
  const role = user.user_metadata?.role;
  if (role !== 'admin' && role !== 'ADMIN') {
    res.status(403).json({ error: 'Keine Berechtigung' });
    return null;
  }
  return { supabaseUser: user };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const guard = await ensureAdmin(req, res);
  if (!guard) return;

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Ungültige ID' });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Ungültiges Passwort (min. 6 Zeichen)' });
  }

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.auth.admin.updateUserById(id, { password });
    if (error) return res.status(500).json({ error: 'Fehler beim Ändern des Passworts', details: error.message });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('Admin users password error:', e);
    return res.status(500).json({ error: 'Interner Serverfehler', details: e?.message || String(e) });
  }
}
