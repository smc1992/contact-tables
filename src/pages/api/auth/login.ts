import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
      return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich' });
    }

    // Benutzer suchen
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Passwort überprüfen
    if (!user || !user.encrypted_password) {
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }

    // Passwort vergleichen
    const isPasswordValid = await bcrypt.compare(password, user.encrypted_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ungültige Anmeldeinformationen' });
    }

    // Erfolgsantwort ohne Passwort
    const { encrypted_password: _, ...userWithoutPassword } = user;
    
    // Erstelle ein JWT-Token, das mit NextAuth kompatibel ist
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 Tage
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    );
    
    // Setze das Token als Cookie
    res.setHeader('Set-Cookie', [
      `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
    ]);
    
    return res.status(200).json({
      message: 'Login erfolgreich',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login-Fehler:', error);
    return res.status(500).json({ message: 'Ein Fehler ist bei der Anmeldung aufgetreten' });
  } finally {
    await prisma.$disconnect();
  }
} 