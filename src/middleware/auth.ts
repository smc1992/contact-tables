import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Definiere UserRole-Enum lokal, da es Probleme mit dem Import aus @prisma/client gibt
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT = 'RESTAURANT',
  ADMIN = 'ADMIN'
}

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: UserRole;
    };

    // Prüfe, ob der Benutzer noch existiert
    const user = await prisma.profile.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: 'Benutzer existiert nicht' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Ungültiger Token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: NextApiResponse, next: () => void) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Nicht authentifiziert' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }

    next();
  };
};

export const generateToken = (user: { id: string; email: string; role: UserRole }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

export const isAdmin = (req: AuthenticatedRequest) => req.user?.role === UserRole.ADMIN;
export const isRestaurant = (req: AuthenticatedRequest) => req.user?.role === UserRole.RESTAURANT;
export const isUser = (req: AuthenticatedRequest) => req.user?.role === UserRole.CUSTOMER; // CUSTOMER ist der korrekte Wert für normale Benutzer 