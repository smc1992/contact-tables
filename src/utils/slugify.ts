import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateBaseSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[ü]/g, 'ue') // Replace umlauts
    .replace(/[ä]/g, 'ae')
    .replace(/[ö]/g, 'oe')
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export async function createUniqueSlug(name: string): Promise<string> {
  let baseSlug = generateBaseSlug(name);
  let finalSlug = baseSlug;
  let counter = 2;

  // Check for uniqueness and append a counter if necessary
  while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
}
