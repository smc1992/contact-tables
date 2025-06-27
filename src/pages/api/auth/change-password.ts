// /pages/api/auth/change-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createPagesServerClient({ req, res });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: No user found or error fetching user', details: userError?.message });
  }

  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'Bad Request: New password is required and must be at least 8 characters long.' });
  }

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      // Supabase gibt spezifische Fehlermeldungen für Passwortrichtlinien etc.
      // z.B. "Password should be at least 6 characters" oder "Password should not be one of the most common passwords"
      // Diese können hier spezifischer behandelt werden, falls gewünscht.
      return res.status(400).json({ error: 'Failed to update password.', details: updateError.message });
    }

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Unexpected error in change-password:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
