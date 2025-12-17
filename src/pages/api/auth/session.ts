// This file is intentionally left blank as next-auth is not used, and custom session handling is replaced by Supabase.
// Supabase is used for authentication.
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ message: 'Not found. Supabase authentication is used for session management.' });
}