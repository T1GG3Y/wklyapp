const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconSizes = {
  'mipmap-mdpi': { size: 48, foreground: 108 },
  'mipmap-hdpi': { size: 72, foreground: 162 },
  'mipmap-xhdpi': { size: 96, foreground: 216 },
  'mipmap-xxhdpi': { size: 144, foreground: 324 },
  'mipmap-xxxhdpi': { size: 192, foreground: 432 },
};

const svgPath = path.join(__dirname, '../public/favicon.svg');
const outputDir = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  console.log('Generating Android launcher icons from SVG...');
  
  // Read the SVG
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const [folder, { size, foreground }] of Object.entries(iconSizes)) {
    const folderPath = path.join(outputDir, folder);
    
    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Generate foreground (just the logo, transparent background)
    const foregroundSvg = `
      <svg width="${foreground}" height="${foreground}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00D1FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00A99D;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="30" font-weight="bold" fill="url(#logo-gradient)">Wkly</text>
      </svg>
    `;
    
    // Generate full icon (with white rounded background)
    const fullSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="12" fill="white"/>
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00D1FF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#00A99D;stop-opacity:1" />
          </linearGradient>
        </defs>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-size="30" font-weight="bold" fill="url(#logo-gradient)">Wkly</text>
      </svg>
    `;
    
    try {
      // Generate foreground icon
      await sharp(Buffer.from(foregroundSvg))
        .resize(foreground, foreground)
        .png()
        .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));
      
      // Generate full launcher icon
      await sharp(Buffer.from(fullSvg))
        .resize(size, size)
        .png()
        .toFile(path.join(folderPath, 'ic_launcher.png'));
      
      // Generate round launcher icon (same as regular for now)
      await sharp(Buffer.from(fullSvg))
        .resize(size, size)
        .png()
        .toFile(path.join(folderPath, 'ic_launcher_round.png'));
      
      console.log(`✓ Generated icons for ${folder}`);
    } catch (error) {
      console.error(`✗ Error generating icons for ${folder}:`, error.message);
    }
  }
  
  console.log('\n✅ All Android launcher icons generated!');
}

generateIcons().catch(console.error);


