// Dieses Skript erstellt Platzhalterbilder für Partner und Blog
const fs = require('fs');
const { createCanvas } = require('canvas');

// Funktion zum Erstellen eines Platzhalterbilds
function createPlaceholderImage(width, height, text, filename, bgColor, textColor) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Hintergrund
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  // Speichern
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created: ${filename}`);
}

// Partner-Logos erstellen
for (let i = 1; i <= 6; i++) {
  createPlaceholderImage(
    200, 80, 
    `Partner ${i}`, 
    `./public/images/partners/partner${i}.png`,
    '#f8f8f8',
    '#333333'
  );
}

// Blog-Bilder erstellen
const blogImages = [
  { name: 'community-dinner.jpg', text: 'Community Dinner' },
  { name: 'restaurant-tips.jpg', text: 'Restaurant Tipps' },
  { name: 'conversation-starters.jpg', text: 'Gesprächsstarter' }
];

blogImages.forEach(img => {
  createPlaceholderImage(
    600, 400,
    img.text,
    `./public/images/blog/${img.name}`,
    '#e0e0e0',
    '#333333'
  );
});

console.log('All placeholder images created successfully!');
