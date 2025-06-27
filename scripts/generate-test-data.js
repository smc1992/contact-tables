const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Beispiel-Daten für Benutzer
const userData = [
  {
    name: 'Max Mustermann',
    email: 'max@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    isPaying: true,
    languageCode: 'DE'
  },
  {
    name: 'Maria Schmidt',
    email: 'maria@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    isPaying: false,
    languageCode: 'DE'
  },
  {
    name: 'Admin User',
    email: 'admin@contact-tables.de',
    password: 'admin123',
    role: 'ADMIN',
    isPaying: true,
    languageCode: 'DE'
  }
];

// Restaurant-Benutzer separat definieren
const restaurantUserData = [
  {
    name: 'Marco Rossi',
    email: 'marco@ristorante-italiano.de',
    password: 'password123',
    role: 'RESTAURANT',
    isPaying: true,
    languageCode: 'DE'
  },
  {
    name: 'Hans Müller',
    email: 'hans@brauhaus-am-markt.de',
    password: 'password123',
    role: 'RESTAURANT',
    isPaying: true,
    languageCode: 'DE'
  },
  {
    name: 'Yuki Tanaka',
    email: 'yuki@sushi-and-more.de',
    password: 'password123',
    role: 'RESTAURANT',
    isPaying: true,
    languageCode: 'DE'
  }
];

// Beispiel-Daten für Restaurants
const restaurantData = [
  {
    name: 'Ristorante Italiano',
    description: 'Authentische italienische Küche in gemütlicher Atmosphäre. Perfekt für gesellige Abende und neue Kontakte.',
    address: 'Italienstraße 42',
    city: 'Berlin',
    postalCode: '10115',
    country: 'DE',
    phone: '+49 30 12345678',
    email: 'info@ristorante-italiano.de',
    website: 'https://ristorante-italiano.de',
    cuisine: 'Italienisch',
    latitude: 52.52,
    longitude: 13.405,
    isVisible: true,
    contractStatus: 'ACTIVE',
    openingHours: JSON.stringify({
      monday: '12:00-22:00',
      tuesday: '12:00-22:00',
      wednesday: '12:00-22:00',
      thursday: '12:00-22:00',
      friday: '12:00-23:00',
      saturday: '12:00-23:00',
      sunday: '12:00-22:00'
    })
  },
  {
    name: 'Brauhaus am Markt',
    description: 'Traditionelle deutsche Küche und hausgebrautes Bier. Der ideale Ort, um neue Freundschaften zu knüpfen.',
    address: 'Marktplatz 10',
    city: 'München',
    postalCode: '80331',
    country: 'DE',
    phone: '+49 89 98765432',
    email: 'info@brauhaus-am-markt.de',
    website: 'https://brauhaus-am-markt.de',
    cuisine: 'Deutsch',
    latitude: 48.137,
    longitude: 11.576,
    isVisible: true,
    contractStatus: 'ACTIVE',
    openingHours: JSON.stringify({
      monday: '11:00-23:00',
      tuesday: '11:00-23:00',
      wednesday: '11:00-23:00',
      thursday: '11:00-23:00',
      friday: '11:00-24:00',
      saturday: '11:00-24:00',
      sunday: '12:00-22:00'
    })
  },
  {
    name: 'Sushi & More',
    description: 'Frisches Sushi und japanische Spezialitäten in moderner Umgebung. Ideal für Gespräche in entspannter Atmosphäre.',
    address: 'Wasabiweg 8',
    city: 'Hamburg',
    postalCode: '20095',
    country: 'DE',
    phone: '+49 40 87654321',
    email: 'info@sushi-and-more.de',
    website: 'https://sushi-and-more.de',
    cuisine: 'Japanisch',
    latitude: 53.551,
    longitude: 9.993,
    isVisible: true,
    contractStatus: 'ACTIVE',
    openingHours: JSON.stringify({
      monday: '12:00-22:00',
      tuesday: '12:00-22:00',
      wednesday: '12:00-22:00',
      thursday: '12:00-22:00',
      friday: '12:00-23:00',
      saturday: '12:00-23:00',
      sunday: 'CLOSED'
    })
  }
];

// Beispiel-Daten für Events (Kontakttische)
const generateEvents = (restaurants) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  return [
    {
      title: 'Gemeinsames Abendessen',
      description: 'Ich freue mich auf neue Bekanntschaften beim Italiener!',
      datetime: tomorrow,
      maxParticipants: 4,
      price: 0,
      restaurantId: restaurants[0].id
    },
    {
      title: 'Bierabend mit neuen Leuten',
      description: 'Gemeinsam Bier trinken und neue Leute kennenlernen.',
      datetime: nextWeek,
      maxParticipants: 6,
      price: 0,
      restaurantId: restaurants[1].id
    },
    {
      title: 'Sushi für Zwei',
      description: 'Sushi-Liebhaber gesucht für gemeinsames Abendessen.',
      datetime: new Date(nextWeek.getTime() + 86400000), // Ein Tag nach nextWeek
      maxParticipants: 2,
      price: 0,
      restaurantId: restaurants[2].id
    }
  ];
};

// Hauptfunktion zum Generieren der Test-Daten
async function generateTestData() {
  try {
    console.log('Starte Generierung von Test-Daten...');
    
    // Bestehende Daten löschen (in der richtigen Reihenfolge wegen Fremdschlüsselbeziehungen)
    console.log('Lösche bestehende Daten...');
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.restaurant.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.contactMessage.deleteMany({});
    
    // Benutzer erstellen
    console.log('Erstelle Benutzer...');
    let createdUsers = [];
    for (const user of userData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const createdUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isPaying: user.isPaying,
          languageCode: user.languageCode,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdUsers.push(createdUser);
      console.log(`Benutzer erstellt: ${user.name} (${user.email})`);
    }
    
    // Restaurant-Benutzer erstellen
    console.log('Erstelle Restaurant-Benutzer...');
    const createdRestaurantUsers = [];
    for (const user of restaurantUserData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const createdUser = await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isPaying: user.isPaying,
          languageCode: user.languageCode,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdRestaurantUsers.push(createdUser);
      console.log(`Restaurant-Benutzer erstellt: ${user.name} (${user.email})`);
    }
    
    // Alle Benutzer zusammenführen
    createdUsers = [...createdUsers, ...createdRestaurantUsers];
    
    // Restaurants erstellen
    console.log('Erstelle Restaurants...');
    const createdRestaurants = [];
    for (let i = 0; i < restaurantData.length; i++) {
      const restaurant = restaurantData[i];
      const restaurantUser = createdRestaurantUsers[i];
      
      const createdRestaurant = await prisma.restaurant.create({
        data: {
          ...restaurant,
          userId: restaurantUser.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      createdRestaurants.push(createdRestaurant);
      console.log(`Restaurant erstellt: ${restaurant.name} (Besitzer: ${restaurantUser.name})`);
    }
    
    // Events (Kontakttische) erstellen
    console.log('Erstelle Events (Kontakttische)...');
    const events = generateEvents(createdRestaurants);
    const createdEvents = [];
    
    for (const event of events) {
      const createdEvent = await prisma.event.create({
        data: {
          ...event,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdEvents.push(createdEvent);
      console.log(`Event erstellt: ${event.title}`);
    }
    
    // Event-Teilnehmer erstellen
    console.log('Erstelle Event-Teilnehmer...');
    for (let i = 0; i < createdEvents.length; i++) {
      const event = createdEvents[i];
      const host = createdUsers[i % 2]; // Abwechselnd Max und Maria als Hosts
      
      await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          userId: host.id,
          isHost: true,
          message: `Ich freue mich auf das Event: ${event.title}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Host ${host.name} für Event ${event.title} erstellt`);
    }
    
    // Kontaktnachrichten erstellen
    console.log('Erstelle Kontaktnachrichten...');
    await prisma.contactMessage.create({
      data: {
        name: 'Interessierter Nutzer',
        email: 'interessiert@example.com',
        subject: 'Frage zur Anmeldung',
        message: 'Ich hätte gerne mehr Informationen zur Anmeldung als Restaurant. Wie funktioniert der Prozess?',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Kontaktnachricht erstellt');
    
    console.log('\nTest-Daten erfolgreich generiert!');
    
    console.log('\nLogin-Daten für Tests:');
    console.log('---------------------');
    console.log('Normaler Benutzer:');
    console.log('E-Mail: max@example.com');
    console.log('Passwort: password123');
    console.log('\nRestaurant-Benutzer:');
    console.log('E-Mail: restaurant@example.com');
    console.log('Passwort: password123');
    console.log('\nAdmin-Benutzer:');
    console.log('E-Mail: admin@contact-tables.de');
    console.log('Passwort: admin123');
    
  } catch (error) {
    console.error('Fehler beim Generieren der Test-Daten:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script ausführen
generateTestData().catch(error => {
  console.error('Unerwarteter Fehler:', error);
  process.exit(1);
});
