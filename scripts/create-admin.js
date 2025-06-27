require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  // Verwende die Admin-E-Mail und das Passwort aus den Umgebungsvariablen oder Standardwerte
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@contact-tables.de';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Prüfen, ob der Admin-Benutzer bereits existiert
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  
  if (existingAdmin) {
    console.log('Admin-Benutzer existiert bereits:', existingAdmin.email);
    await prisma.$disconnect();
    return;
  }
  
  // Passwort hashen
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  try {
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        languageCode: 'DE',
        isActive: true,
        isPaying: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Admin-Benutzer erfolgreich erstellt:', admin.email);
  } catch (error) {
    console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin().catch(error => {
  console.error('Unerwarteter Fehler:', error);
  process.exit(1);
}); 