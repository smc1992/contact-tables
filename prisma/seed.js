const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Standardpasswort für alle Testkonten
  const testPassword = await bcrypt.hash('test123', 10);
  
  // 1. Admin-Benutzer erstellen
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: testPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@example.com',
      name: 'Administrator',
      password: testPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin-Benutzer erstellt:', admin.email);
  
  // 2. Restaurant-Benutzer erstellen
  const restaurant = await prisma.user.upsert({
    where: { email: 'restaurant@example.com' },
    update: {
      password: testPassword,
      role: 'RESTAURANT',
    },
    create: {
      email: 'restaurant@example.com',
      name: 'Restaurant Manager',
      password: testPassword,
      role: 'RESTAURANT',
    },
  });
  console.log('Restaurant-Benutzer erstellt:', restaurant.email);
  
  // 3. Kundenbenutzer erstellen (CUSTOMER)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {
      password: testPassword,
      role: 'CUSTOMER',
    },
    create: {
      email: 'customer@example.com',
      name: 'Max Mustermann',
      password: testPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('Kunden-Benutzer erstellt:', customer.email);
  
  // 4. Standard-Benutzer erstellen (USER)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: testPassword,
      role: 'USER',
    },
    create: {
      email: 'user@example.com',
      name: 'Anna Schmidt',
      password: testPassword,
      role: 'USER',
    },
  });
  console.log('Standard-Benutzer erstellt:', user.email);
  
  // 5. Benutzer für den Projektinhaber
  const owner = await prisma.user.upsert({
    where: { email: 'info@consulting-smc.de' },
    update: {
      password: testPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'info@consulting-smc.de',
      name: 'Simon Müller',
      password: testPassword,
      role: 'ADMIN',
    },
  });
  console.log('Projektinhaber-Benutzer erstellt:', owner.email);
  
  console.log('Alle Testbenutzer wurden erfolgreich erstellt');
  
  // Testrestaurants erstellen
  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 'cltest1' },
    update: {},
    create: {
      id: 'cltest1',
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
      user: {
        create: {
          email: 'restaurant1@example.com',
          name: 'Restaurant Manager 1',
          password: await bcrypt.hash('restaurant123', 10),
          role: 'RESTAURANT',
        }
      }
    },
  });
  
  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'cltest2' },
    update: {},
    create: {
      id: 'cltest2',
      name: 'Zum Goldenen Drachen',
      address: 'Kantstraße 45',
      city: 'Berlin',
      postalCode: '10623',
      country: 'Deutschland',
      description: 'Traditionelle chinesische Spezialitäten',
      cuisine: 'Chinesisch',
      phone: '+49 30 98765432',
      email: 'info@goldener-drache.de',
      website: 'www.goldener-drache.de',
      bookingUrl: 'https://www.goldener-drache.de/reservierung',
      imageUrl: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c',
      isVisible: true,
      user: {
        create: {
          email: 'restaurant2@example.com',
          name: 'Restaurant Manager 2',
          password: await bcrypt.hash('restaurant123', 10),
          role: 'RESTAURANT',
        }
      }
    },
  });
  
  console.log('Testrestaurants erstellt:', restaurant1, restaurant2);
  
  // Kontakttische erstellen
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(18, 30, 0, 0);
  
  const contactTable1 = await prisma.event.create({
    data: {
      title: 'Gemeinsames Abendessen',
      description: 'Ich bin neu in Berlin und suche nette Leute zum gemeinsamen Essen und Kennenlernen.',
      datetime: tomorrow,
      maxParticipants: 4,
      price: 0,
      restaurant: {
        connect: { id: restaurant1.id }
      },
      participants: {
        create: {
          user: {
            connect: { id: customer.id }
          },
          isHost: true,
          message: 'Ich freue mich auf neue Kontakte!'
        }
      }
    },
  });
  
  const contactTable2 = await prisma.event.create({
    data: {
      title: 'Chinesisch essen gehen',
      description: 'Wer hat Lust auf authentisches chinesisches Essen in geselliger Runde?',
      datetime: nextWeek,
      maxParticipants: 6,
      price: 0,
      restaurant: {
        connect: { id: restaurant2.id }
      },
      participants: {
        create: {
          user: {
            connect: { id: user.id }
          },
          isHost: true,
          message: 'Ich bin offen für neue Bekanntschaften und liebe chinesisches Essen!'
        }
      }
    },
  });
  
  console.log('Kontakttische erstellt:', contactTable1, contactTable2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
