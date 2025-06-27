import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        email,
        encrypted_password: hashedPassword,
      },
    });

    // Exclude password from the returned user object
    const { encrypted_password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Registration error:', error);
    // Check for specific Prisma errors if needed, e.g., unique constraint violation
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { ... }
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}
