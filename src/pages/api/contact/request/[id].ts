import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }

  const userId = session.user.id;
  
  // Überprüfen, ob der Benutzer bezahlt hat
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  if (!user || (!user.isPaying && user.role !== 'ADMIN')) {
    return res.status(403).json({ message: 'Nur bezahlte Benutzer können Kontakttische nutzen' });
  }
  
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Ungültige Anfrage-ID' });
  }

  // GET: Details einer Kontaktanfrage abrufen
  if (req.method === 'GET') {
    try {
      // Kontaktanfrage mit allen Details abrufen
      const contactRequest = await prisma.event.findUnique({
        where: { id },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              postalCode: true,
              phone: true,
              email: true,
              website: true,
              bookingUrl: true,
              imageUrl: true,
            }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        }
      });

      if (!contactRequest) {
        return res.status(404).json({ message: 'Kontaktanfrage nicht gefunden' });
      }

      // Verfügbarkeit und Status berechnen
      const availableSeats = contactRequest.maxParticipants - contactRequest._count.participants;
      const isFull = availableSeats <= 0;
      const isPast = new Date(contactRequest.datetime) < new Date();
      
      let status = 'OPEN';
      if (isPast) status = 'PAST';
      else if (isFull) status = 'FULL';
      
      // Überprüfen, ob der aktuelle Benutzer der Host ist
      const isHost = contactRequest.participants.some((p: any) => p.userId === userId && p.isHost);
      
      // Überprüfen, ob der aktuelle Benutzer ein Teilnehmer ist
      const isParticipant = contactRequest.participants.some((p: any) => p.userId === userId);

      return res.status(200).json({
        message: 'Kontaktanfrage erfolgreich abgerufen',
        contactRequest: {
          ...contactRequest,
          availableSeats,
          status,
          isHost,
          isParticipant
        }
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kontaktanfrage:', error);
      return res.status(500).json({ 
        message: 'Interner Serverfehler', 
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
      });
    }
  }

  return res.status(405).json({ message: 'Methode nicht erlaubt' });
}
