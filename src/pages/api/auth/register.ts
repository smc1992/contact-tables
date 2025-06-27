import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validierung der Eingaben
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Überprüfen, ob der Benutzer bereits existiert
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Benutzer erstellen
    const newUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        encrypted_password: hashedPassword,
      },
    });

    // Erfolgsantwort ohne Passwort
    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 