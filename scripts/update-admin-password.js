const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    const admin = await prisma.user.update({
      where: {
        email: 'admin@contact-tables.com'
      },
      data: {
        password: hashedPassword
      }
    });
    console.log('Admin-Passwort erfolgreich aktualisiert:', admin);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Admin-Passworts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 