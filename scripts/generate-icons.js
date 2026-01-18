// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple SVG icon template with SalonixPro branding
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0D9488"/>
  <text 
    x="50%" 
    y="55%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="middle"
  >S</text>
</svg>
`.trim();

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: icon-${size}x${size}.svg`);
});

// Create a simple favicon
const favicon = createSvgIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), favicon);
console.log('Created: favicon.svg');

console.log('\\nIcons generated! For PNG icons, use an online converter or design tool.');
console.log('Update manifest.json to use .svg extension if using SVG icons.');
