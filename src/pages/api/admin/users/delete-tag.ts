import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { withAdminAuth } from '../../middleware/withAdminAuth';

const prisma = new PrismaClient();

async function handler(req: NextApiRequest, res: NextApiResponse, userId: string) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tagId } = req.query;

  if (!tagId || typeof tagId !== 'string') {
    return res.status(400).json({ error: 'Tag ID ist erforderlich' });
  }

  try {
    // Prüfen, ob der Tag existiert
    const tag = await prisma.userTag.findUnique({
      where: { id: tagId }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag nicht gefunden' });
    }

    // Transaktion verwenden, um zuerst alle Zuweisungen zu löschen und dann den Tag selbst
    await prisma.$transaction(async (tx) => {
      // Alle Zuweisungen dieses Tags löschen
      await tx.userTagAssignment.deleteMany({
        where: { tagId }
      });

      // Den Tag selbst löschen
      await tx.userTag.delete({
        where: { id: tagId }
      });
    });

    return res.status(200).json({ success: true, message: `Tag "${tag.name}" wurde erfolgreich gelöscht` });
  } catch (error) {
    console.error('Fehler beim Löschen des Tags:', error);
    return res.status(500).json({ error: 'Interner Serverfehler beim Löschen des Tags' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAdminAuth(handler);
