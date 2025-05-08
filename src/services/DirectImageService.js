/**
 * DirectImageService.js
 * This service provides images directly from memory without requiring S3/LocalStack
 * It's a solution for environments where external dependencies are problematic
 */

// In-memory store for product images
const imageStore = new Map();

// Generate a simple colored SVG for a product
function generateColoredSvg(id, width = 200, height = 200) {
  // Get a color based on the ID (to ensure it's consistent but different)
  const hue = (id * 137) % 360; // Golden ratio hack for nice distribution
  const saturation = 80;
  const lightness = 50;
  
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Create SVG with the product ID prominently displayed
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white" />
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="${color}" rx="20" ry="20" />
  <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">${id}</text>
  <text x="${width/2}" y="${height/2 + 50}" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Product ID: ${id}</text>
</svg>`;
  
  return {
    data: Buffer.from(svg),
    contentType: 'image/svg+xml'
  };
}

// Initialize with some example images
function initializeImageStore() {
  console.log('Initializing in-memory image store with example images');
  
  // Create images for products 1-10
  for (let id = 1; id <= 10; id++) {
    const image = generateColoredSvg(id);
    imageStore.set(id.toString(), image);
    console.log(`Generated image for product ${id}`);
  }
}

// Get an image for a product ID
function getImage(id) {
  // If image doesn't exist for this ID, generate one
  if (!imageStore.has(id.toString())) {
    console.log(`Generating new image for product ${id}`);
    const image = generateColoredSvg(id);
    imageStore.set(id.toString(), image);
    return image;
  }
  
  // Return existing image
  return imageStore.get(id.toString());
}

// Store an image for a product ID
function storeImage(id, data, contentType = 'image/svg+xml') {
  console.log(`Storing custom image for product ${id}`);
  imageStore.set(id.toString(), { data, contentType });
  return true;
}

// Initialize on module load
initializeImageStore();

module.exports = {
  getImage,
  storeImage,
  generateColoredSvg
};
