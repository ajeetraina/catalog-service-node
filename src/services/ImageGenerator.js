/**
 * Image Generator for Product Catalog
 * Creates lightweight SVG images for product categories
 */

// Color schemes for different product categories
const categoryColors = {
  audio: {
    primary: '#3498db',    // Blue
    secondary: '#2980b9',
    icon: 'M12,3C7.03,3 3,7.03 3,12C3,16.97 7.03,21 12,21C16.97,21 21,16.97 21,12C21,7.03 16.97,3 12,3M12,19C8.13,19 5,15.87 5,12C5,8.13 8.13,5 12,5C15.87,5 19,8.13 19,12C19,15.87 15.87,19 12,19M14,10.5V8.5H10V15.5H14V13.5H12V10.5H14Z'
  },
  lighting: {
    primary: '#f1c40f',    // Yellow
    secondary: '#f39c12',
    icon: 'M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z'
  },
  wellness: {
    primary: '#2ecc71',    // Green
    secondary: '#27ae60',
    icon: 'M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10Z'
  },
  time: {
    primary: '#9b59b6',    // Purple
    secondary: '#8e44ad',
    icon: 'M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z'
  },
  creativity: {
    primary: '#e74c3c',    // Red
    secondary: '#c0392b',
    icon: 'M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21C8.21,21 10,19.21 10,17C10,15.69 9.04,14.58 7.72,14.14L7,14Z'
  },
  default: {
    primary: '#95a5a6',    // Gray
    secondary: '#7f8c8d',
    icon: 'M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z'
  }
};

// Map prefixes to categories
const prefixToCategory = {
  'EchoWave': 'audio',
  'Lumina': 'lighting',
  'Zephyr': 'wellness',
  'Chronos': 'time',
  'Aetheria': 'creativity'
};

// Determine category from product name or ID
function getProductCategory(id, name = '') {
  // If we have a name, try to determine category from prefix
  if (name) {
    for (const [prefix, category] of Object.entries(prefixToCategory)) {
      if (name.startsWith(prefix)) {
        return category;
      }
    }
  }
  
  // Fallback to category based on ID
  const idNum = parseInt(id, 10);
  
  // Map product IDs to specific categories for consistency
  const categories = Object.values(prefixToCategory);
  return categories[idNum % categories.length] || 'default';
}

// Generate a colored SVG for a product
function generateColoredSvg(id, name = '', width = 300, height = 300) {
  // Get category based on product name or ID
  const category = getProductCategory(id, name);
  
  // Get colors for this category
  const { primary, secondary, icon } = categoryColors[category] || categoryColors.default;
  
  // Make the SVG for this product
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="white"/>
  
  <!-- Main colored background -->
  <rect x="10" y="10" width="${width-20}" height="${height-20}" rx="15" fill="${primary}" />
  
  <!-- Category icon -->
  <g transform="translate(${width/2-50}, ${height/2-90}) scale(4)">
    <path d="${icon}" fill="${secondary}"/>
  </g>
  
  <!-- Product ID -->
  <text x="${width/2}" y="${height-80}" font-family="Arial" font-size="24" font-weight="bold" fill="white" text-anchor="middle">ID: ${id}</text>
  
  <!-- Category label -->
  <text x="${width/2}" y="${height-40}" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Category: ${category}</text>
  
  <!-- LocalStack brand -->
  <text x="${width/2}" y="${height-15}" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Powered by LocalStack</text>
</svg>`;
  
  return Buffer.from(svg);
}

module.exports = {
  generateColoredSvg,
  getProductCategory
};
