import { NextApiRequest, NextApiResponse } from 'next';

// This file is intentionally left blank as next-auth is not used.
// Supabase is used for authentication.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ message: 'Not found. Supabase authentication is used.' });
}