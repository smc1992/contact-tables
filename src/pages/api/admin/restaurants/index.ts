import { NextApiResponse } from 'next';
import { PrismaClient, ContractStatus, Prisma } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest, UserRole } from '../../../../middleware/auth';

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const { status, page = '1', limit = '10' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        // TypeScript-Cast für contractStatus
        const where = status ? {
          contractStatus: status as any, // Cast zu any, um Typfehler zu vermeiden
        } : {};

        const [restaurants, total] = await Promise.all([
          prisma.restaurant.findMany({
            where,
            include: {
              profile: {
                select: {
                  name: true,
                },
              },
              contract: true,
              _count: {
                select: {
                  events: true,
                },
              },
            },
            skip,
            take: parseInt(limit as string),
            orderBy: {
              createdAt: 'desc',
            },
          }),
          prisma.restaurant.count({ where }),
        ]);

        res.status(200).json({
          restaurants,
          pagination: {
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
            currentPage: parseInt(page as string),
            perPage: parseInt(limit as string),
          },
        });
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'PATCH':
      try {
        const { id } = req.query;
        const {
          isVisible,
          contractStatus,
          contractStartDate,
          trialEndDate,
        } = req.body;

        if (!id) {
          return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
        }

        const restaurant = await prisma.restaurant.update({
          where: { id: id as string },
          data: {
            ...(typeof isVisible === 'boolean' && { isVisible }),
            ...(contractStatus && { contractStatus }),
            ...(contractStartDate && { contractStartDate: new Date(contractStartDate) }),
            ...(trialEndDate && { trialEndDate: new Date(trialEndDate) }),
          },
          include: {
            profile: {
              select: {
                name: true,
              },
            },
            contract: true,
          },
        });

        res.status(200).json(restaurant);
      } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ message: 'Restaurant-ID ist erforderlich' });
        }

        // Lösche zuerst alle abhängigen Datensätze
        await prisma.$transaction([
          prisma.event.deleteMany({
            where: { restaurantId: id as string },
          }),
          prisma.contract.deleteMany({
            where: { restaurantId: id as string },
          }),
          prisma.restaurant.delete({
            where: { id: id as string },
          }),
        ]);

        res.status(204).end();
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ message: 'Ein Fehler ist aufgetreten' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Middleware-Kette für Authentifizierung und Rollenbeschränkung
export default async function (req: AuthenticatedRequest, res: NextApiResponse) {
  await authenticateToken(req, res, () => {
    requireRole([UserRole.ADMIN])(req, res, () => {
      handler(req, res);
    });
  });
} 