import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validierung der Eingaben
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Überprüfen, ob der Benutzer bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Benutzer erstellen
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER'
      }
    });

    // Erfolgsantwort ohne Passwort
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 