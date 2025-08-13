import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A simple function to convert a string to a URL-friendly slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

async function main() {
  console.log('Starting to generate slugs for existing restaurants...');

  const restaurantsWithoutSlugs = await prisma.restaurant.findMany({
    where: {
      slug: null,
    },
  });

  if (restaurantsWithoutSlugs.length === 0) {
    console.log('All restaurants already have slugs. Exiting.');
    return;
  }

  console.log(`Found ${restaurantsWithoutSlugs.length} restaurants without a slug.`);

  for (const restaurant of restaurantsWithoutSlugs) {
    let baseSlug = slugify(restaurant.name);
    let finalSlug = baseSlug;
    let counter = 2;

    // Check for uniqueness and append a counter if necessary
    while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { slug: finalSlug },
    });

    console.log(`Generated slug '${finalSlug}' for restaurant '${restaurant.name}'.`);
  }

  console.log('Finished generating slugs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
