import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Language, CmsSectionType } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../../../../middleware/auth';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { languageCode = 'DE' } = req.query;
        
        const sections = await prisma.cmsSection.findMany({
          where: {
            languageCode: languageCode as Language,
          },
          orderBy: {
            position: 'asc',
          },
        });
        
        res.status(200).json(sections);
      } catch (error) {
        console.error('Error fetching CMS sections:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'POST':
      try {
        const {
          title,
          key,
          content,
          position,
          languageCode,
          type,
        } = req.body;

        // Validierung
        if (!title || !key || !content || !position || !languageCode || !type) {
          return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
        }

        const section = await prisma.cmsSection.create({
          data: {
            title,
            key,
            content,
            position,
            languageCode: languageCode as Language,
            type: type as CmsSectionType,
          },
        });

        res.status(201).json(section);
      } catch (error) {
        console.error('Error creating CMS section:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'PATCH':
      try {
        const { id } = req.query;
        const {
          title,
          content,
          position,
          isActive,
        } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'ID ist erforderlich' });
        }

        const section = await prisma.cmsSection.update({
          where: { id: id as string },
          data: {
            ...(title && { title }),
            ...(content && { content }),
            ...(position && { position }),
            ...(typeof isActive === 'boolean' && { isActive }),
          },
        });

        res.status(200).json(section);
      } catch (error) {
        console.error('Error updating CMS section:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: 'ID ist erforderlich' });
        }

        await prisma.cmsSection.delete({
          where: { id: id as string },
        });

        res.status(204).end();
      } catch (error) {
        console.error('Error deleting CMS section:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Middleware-Kette für Authentifizierung und Rollenbeschränkung
export default async function (req: AuthenticatedRequest, res: NextApiResponse) {
  await authenticateToken(req, res, () => {
    // Verwende das UserRole-Enum aus dem auth-Modul
    const { UserRole } = require('../../../../middleware/auth');
    requireRole([UserRole.ADMIN])(req, res, () => {
      handler(req, res);
    });
  });
} 