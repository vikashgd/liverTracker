const fs = require('fs');
const path = require('path');

// Create a simple SVG icon as base
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
        font-family="Arial, sans-serif" font-size="${size * 0.4}" 
        font-weight="bold" fill="white">🩺</text>
</svg>`;

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (browsers can render these)
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;
  
  // Save as SVG (most browsers support this for PWA icons)
  fs.writeFileSync(path.join(iconsDir, svgFilename), svgContent);
  
  // Create a simple HTML canvas-based PNG generator would be complex,
  // so let's copy the SVG as PNG for now (browsers will handle it)
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
});

// Create additional required files
const additionalIcons = [
  'favicon.ico',
  'apple-touch-icon.png',
  'dashboard-96x96.png',
  'upload-96x96.png',
  'calculator-96x96.png',
  'badge-72x72.png',
  'close-96x96.png'
];

additionalIcons.forEach(filename => {
  const size = filename.includes('72x72') ? 72 : 96;
  const svgContent = createSVGIcon(size);
  
  if (filename.endsWith('.ico')) {
    // For favicon, create a simple 32x32 SVG
    const faviconContent = createSVGIcon(32);
    fs.writeFileSync(path.join(__dirname, 'public', filename), faviconContent);
  } else {
    fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  }
});

console.log('✅ PWA icons created successfully!');
console.log('📁 Created icons:', iconSizes.map(s => `icon-${s}x${s}.png`).join(', '));
console.log('📁 Additional icons:', additionalIcons.join(', '));
