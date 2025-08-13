import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Starting to backfill coordinates for restaurants...');

  const restaurantsToUpdate = await prisma.restaurant.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
  });

  if (restaurantsToUpdate.length === 0) {
    console.log('No restaurants found that need coordinate backfilling. All good!');
    return;
  }

  console.log(`Found ${restaurantsToUpdate.length} restaurants to update.`);

  let updatedCount = 0;
  let failedCount = 0;

  for (const restaurant of restaurantsToUpdate) {
    if (!restaurant.address || !restaurant.city || !restaurant.postal_code || !restaurant.country) {
      console.log(`Skipping restaurant ${restaurant.id} (${restaurant.name}) due to incomplete address.`);
      failedCount++;
      continue;
    }

    const fullAddress = `${restaurant.address}, ${restaurant.postal_code} ${restaurant.city}, ${restaurant.country}`;
    
    console.log(`Processing: ${restaurant.name} - ${fullAddress}`);

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'Contact-Tables-App/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const lat = parseFloat(response.data[0].lat);
        const lon = parseFloat(response.data[0].lon);

        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            latitude: lat,
            longitude: lon,
          },
        });
        
        console.log(`  -> Successfully updated coordinates to (${lat}, ${lon})`);
        updatedCount++;
      } else {
        console.log(`  -> Could not find coordinates for this address.`);
        failedCount++;
      }
    } catch (error) {
      console.error(`  -> An error occurred while geocoding for restaurant ${restaurant.id}:`, error);
      failedCount++;
    }

    // Add a delay to avoid hitting API rate limits
    await sleep(1000); // 1 second delay
  }

  console.log('\nBackfill process finished.');
  console.log(`Successfully updated: ${updatedCount} restaurants.`);
  console.log(`Failed to update: ${failedCount} restaurants.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
