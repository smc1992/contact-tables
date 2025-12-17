const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // This seed script creates profiles and associated data.
  // It assumes that corresponding users in Supabase Auth already exist or will be created manually.
  // The IDs used here should match the UUIDs of the users in Supabase Auth.

  // 1. Admin-Benutzer erstellen/aktualisieren
  const admin = await prisma.profile.upsert({
    where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }, // Replace with actual Supabase user ID
    update: {},
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Administrator',
      role: 'ADMIN',
    },
  });
  console.log('Admin-Profil erstellt/aktualisiert für ID:', admin.id);

  // 2. Restaurant-Benutzer erstellen/aktualisieren
  const restaurantManager = await prisma.profile.upsert({
    where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12' }, // Replace with actual Supabase user ID
    update: {},
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      name: 'Restaurant Manager',
      role: 'RESTAURANT',
    },
  });
  console.log('Restaurant-Profil erstellt/aktualisiert für ID:', restaurantManager.id);

  // 3. Kundenbenutzer erstellen (CUSTOMER)
  const customer = await prisma.profile.upsert({
    where: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13' }, // Replace with actual Supabase user ID
    update: {},
    create: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
      name: 'Max Mustermann',
      role: 'CUSTOMER',
    },
  });
  console.log('Kunden-Profil erstellt/aktualisiert für ID:', customer.id);

  console.log('Alle Testprofile wurden erfolgreich erstellt/aktualisiert.');

  // Testrestaurants erstellen
  const restaurant1 = await prisma.restaurant.upsert({
    where: { userId: restaurantManager.id }, // Use the unique userId for the upsert operation
    update: {
      name: 'Bella Italia', // Ensure critical fields are correct on subsequent seeds
      description: 'Authentische italienische Küche in gemütlicher Atmosphäre',
    },
    create: {
      name: 'Bella Italia',
      address: 'Hauptstraße 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      description: 'Authentische italienische Küche in gemütlicher Atmosphäre',
      cuisine: 'Italienisch',
      phone: '+49 30 12345678',
      email: 'info@bella-italia.de',
      website: 'www.bella-italia.de',
      bookingUrl: 'https://www.bella-italia.de/reservierung',
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      isVisible: true,
      userId: restaurantManager.id, // Link to the restaurant manager's profile
    },
  });

  console.log('Testrestaurant erstellt:', restaurant1.name);

  // Kontakttische erstellen
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const contactTable1 = await prisma.event.create({
    data: {
      title: 'Gemeinsames Abendessen',
      description: 'Ich bin neu in Berlin und suche nette Leute zum gemeinsamen Essen und Kennenlernen.',
      datetime: tomorrow,
      maxParticipants: 4,
      price: 0,
      restaurantId: restaurant1.id,
      participants: {
        create: {
          userId: customer.id, // The customer is the host
          isHost: true,
          message: 'Ich freue mich auf neue Kontakte!',
        },
      },
    },
  });

  console.log('Kontakttisch erstellt:', contactTable1.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
