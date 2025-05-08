const { createProduct } = require("./ProductService");
const { uploadFile } = require("./StorageService");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Product categories with associated templates and image generation data
const productCategories = [
  {
    prefix: "EchoWave",
    category: "Audio",
    templates: [
      { name: "{prefix} Sound Sphere", price: () => 125 + Math.floor(Math.random() * 100) },
      { name: "{prefix} Ambient Pulse", price: () => 155 + Math.floor(Math.random() * 70) },
      { name: "{prefix} Resonance Pod", price: () => 175 + Math.floor(Math.random() * 80) },
    ],
    descriptions: [
      "Immerse yourself in crystal-clear sound with this innovative audio device. The {name} creates an enveloping soundscape that adapts to your space, delivering rich bass and crisp highs. Features customizable sound profiles and wireless connectivity.",
      "Experience sound in a whole new dimension with the {name}. Its proprietary acoustic technology creates a personal sound bubble that follows you throughout your space. Perfect for immersive listening without headphones.",
      "Transform any room into a concert hall with the {name}. Using advanced spatial audio algorithms, it projects sound evenly in all directions, eliminating dead zones and creating a consistent listening experience anywhere in the room."
    ],
    // Colors for audio devices - typically black, silver, metallic
    colors: ['#1A1A1A', '#D6D6D6', '#555555', '#1E2D40', '#AFAFAF', '#303030'],
    shape: 'circle'
  },
  {
    prefix: "Lumina",
    category: "Lighting",
    templates: [
      { name: "{prefix} Glow Cascade", price: () => 90 + Math.floor(Math.random() * 60) },
      { name: "{prefix} Ambient Halo", price: () => 110 + Math.floor(Math.random() * 50) },
      { name: "{prefix} Aurora Panel", price: () => 130 + Math.floor(Math.random() * 70) },
    ],
    descriptions: [
      "Elevate your space with the {name}, featuring dynamic lighting that responds to sound and movement. Its organic light patterns create a living atmosphere that changes throughout the day. Energy-efficient LEDs provide months of continuous use.",
      "Create the perfect ambiance with the {name}. This intelligent lighting system adapts to your circadian rhythm, gradually shifting from energizing daylight to soothing warm tones as evening approaches. Includes programmable scenes for any mood.",
      "Bring natural light indoors with the {name}. Its advanced spectrum matching technology replicates natural sunlight, helping regulate mood and energy levels. Perfect for spaces with limited windows or dark winter months."
    ],
    // Colors for lighting - warm glows, soft hues
    colors: ['#FFDD99', '#E2F0FF', '#FFC266', '#B3D9FF', '#FFB3B3', '#E6F7FF'],
    shape: 'square'
  },
  {
    prefix: "Zephyr",
    category: "Wellness",
    templates: [
      { name: "{prefix} Meditation Stone", price: () => 145 + Math.floor(Math.random() * 50) },
      { name: "{prefix} Dream Enhancer", price: () => 165 + Math.floor(Math.random() * 60) },
      { name: "{prefix} Tranquility Sphere", price: () => 185 + Math.floor(Math.random() * 40) },
    ],
    descriptions: [
      "Find your center with the {name}, a revolutionary wellness device that uses subtle vibrations to guide your meditation practice. Its gentle pulses help synchronize your breathing and calm your mind. Includes five different meditation programs.",
      "Enhance your natural sleep patterns with the {name}. Using a combination of ambient sound, subtle light, and optional aromatherapy, it creates the ideal conditions for restful sleep and vivid dreams. Wake feeling refreshed and energized.",
      "Release tension and find balance with the {name}. This holistic wellness device combines warmth, gentle pressure, and optional essential oil diffusion to create a deeply relaxing experience. Perfect for stress relief after a long day."
    ],
    // Colors for wellness products - calming, earthy, natural tones
    colors: ['#A5D6A7', '#90CAF9', '#E6EE9C', '#80DEEA', '#CE93D8', '#FFCC80'],
    shape: 'round'
  },
  {
    prefix: "Chronos",
    category: "Time",
    templates: [
      { name: "{prefix} Moment Capsule", price: () => 170 + Math.floor(Math.random() * 80) },
      { name: "{prefix} Time Shifter", price: () => 190 + Math.floor(Math.random() * 60) },
      { name: "{prefix} Memory Keeper", price: () => 150 + Math.floor(Math.random() * 70) },
    ],
    descriptions: [
      "Capture fleeting moments with the {name}. This elegant device distorts your perception of time, making special moments feel longer and more vivid. Perfect for savoring life's precious experiences. (Note: Subjective results may vary.)",
      "Experience time differently with the {name}. Using subtle sensory cues, it can make time feel like it's passing more slowly or quickly depending on your needs. Ideal for improving focus during work or making leisure time feel more expansive.",
      "Preserve your memories with the {name}. This unique timepiece doesn't just tell time?it helps you record and relive important moments through integrated journaling prompts and memory-enhancing techniques. A treasured keepsake for years to come."
    ],
    // Colors for time devices - elegant, classic, metallic
    colors: ['#CFB53B', '#C0C0C0', '#B87333', '#4682B4', '#CD7F32', '#E5E4E2'],
    shape: 'hexagon'
  },
  {
    prefix: "Aetheria",
    category: "Creativity",
    templates: [
      { name: "{prefix} Inspiration Cube", price: () => 115 + Math.floor(Math.random() * 50) },
      { name: "{prefix} Sensory Quill", price: () => 135 + Math.floor(Math.random() * 40) },
      { name: "{prefix} Muse Beacon", price: () => 125 + Math.floor(Math.random() * 60) },
    ],
    descriptions: [
      "Unlock your creative potential with the {name}. This unique device generates subtle sensory stimuli designed to activate your imagination and help overcome creative blocks. Personalize settings for your specific creative practice.",
      "Enhance your artistic expression with the {name}. Responding to your emotions and biorhythms, it creates a personalized environment conducive to creativity. Features adjustable ambient lighting and optional sound profiles.",
      "Find inspiration anywhere with the {name}. This pocket-sized creativity tool uses algorithmic prompts and unexpected combinations to spark new ideas and perspectives. Perfect for writers, designers, and innovators of all kinds."
    ],
    // Colors for creativity tools - vibrant, inspirational
    colors: ['#FF5252', '#7C4DFF', '#FFAB40', '#64FFDA', '#FF4081', '#18FFFF'],
    shape: 'triangle'
  }
];

// Generate a random UPC code (12 digits)
function generateUPC() {
  return Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
}

// Create a simple SVG image based on product category
function generateProductImage(category) {
  const colors = category.colors;
  const mainColor = colors[Math.floor(Math.random() * colors.length)];
  const accentColor = colors[Math.floor(Math.random() * colors.length)];
  const backgroundColor = '#FFFFFF';
  
  // Make sure main and accent colors are different
  const secondaryColor = mainColor === accentColor ? 
    colors[Math.floor(Math.random() * colors.length) % colors.length] : 
    accentColor;
  
  // Canvas size
  const width = 300;
  const height = 300;
  
  // Generate a random shape based on the category
  let shapeElement;
  const cx = width / 2;
  const cy = height / 2;
  
  switch(category.shape) {
    case 'circle':
      const radius = 100 + Math.floor(Math.random() * 50);
      shapeElement = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
      break;
    case 'square':
      const size = 150 + Math.floor(Math.random() * 40);
      shapeElement = `<rect x="${cx - size/2}" y="${cy - size/2}" width="${size}" height="${size}" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
      break;
    case 'triangle':
      const points = `${cx},${cy - 80} ${cx - 80},${cy + 60} ${cx + 80},${cy + 60}`;
      shapeElement = `<polygon points="${points}" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
      break;
    case 'hexagon':
      const r = 80;
      const hexPoints = Array.from({length: 6}, (_, i) => {
        const angle = (Math.PI / 3) * i;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
      shapeElement = `<polygon points="${hexPoints}" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
      break;
    case 'round':
      const ellipseRx = 100;
      const ellipseRy = 80;
      shapeElement = `<ellipse cx="${cx}" cy="${cy}" rx="${ellipseRx}" ry="${ellipseRy}" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
      break;
    default:
      // Default to a circle
      shapeElement = `<circle cx="${cx}" cy="${cy}" r="100" fill="${mainColor}" stroke="${secondaryColor}" stroke-width="5" />`;
  }
  
  // Add some decorative elements based on category
  let decorations = '';
  
  if (category.category === 'Audio') {
    // Sound waves
    decorations = `
      <circle cx="${cx}" cy="${cy}" r="30" fill="${secondaryColor}" />
      <circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="${secondaryColor}" stroke-width="2" stroke-dasharray="5,5" />
      <circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${secondaryColor}" stroke-width="2" stroke-dasharray="5,5" />
    `;
  } else if (category.category === 'Lighting') {
    // Light rays
    const rays = Array.from({length: 8}, (_, i) => {
      const angle = (Math.PI / 4) * i;
      const x1 = cx + 60 * Math.cos(angle);
      const y1 = cy + 60 * Math.sin(angle);
      const x2 = cx + 120 * Math.cos(angle);
      const y2 = cy + 120 * Math.sin(angle);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${secondaryColor}" stroke-width="3" />`;
    }).join('');
    decorations = rays;
  } else if (category.category === 'Wellness') {
    // Concentric circles for meditation
    decorations = `
      <circle cx="${cx}" cy="${cy}" r="40" fill="none" stroke="${secondaryColor}" stroke-width="3" />
      <circle cx="${cx}" cy="${cy}" r="60" fill="none" stroke="${secondaryColor}" stroke-width="2" />
      <circle cx="${cx}" cy="${cy}" r="80" fill="none" stroke="${secondaryColor}" stroke-width="1" />
    `;
  } else if (category.category === 'Time') {
    // Clock hands
    const hourHand = `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 40}" stroke="${secondaryColor}" stroke-width="4" />`;
    const minuteHand = `<line x1="${cx}" y1="${cy}" x2="${cx + 60}" y2="${cy}" stroke="${secondaryColor}" stroke-width="3" />`;
    decorations = hourHand + minuteHand + `<circle cx="${cx}" cy="${cy}" r="5" fill="${secondaryColor}" />`;
  } else if (category.category === 'Creativity') {
    // Abstract shapes
    decorations = `
      <circle cx="${cx - 40}" cy="${cy - 40}" r="20" fill="${secondaryColor}" fill-opacity="0.6" />
      <rect x="${cx + 20}" y="${cy - 60}" width="30" height="30" fill="${secondaryColor}" fill-opacity="0.6" />
      <polygon points="${cx - 20},${cy + 40} ${cx},${cy + 60} ${cx + 20},${cy + 40}" fill="${secondaryColor}" fill-opacity="0.6" />
    `;
  }
  
  // Generate the SVG
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}" />
  ${shapeElement}
  ${decorations}
</svg>`;
  
  return Buffer.from(svg);
}

// Create a random product based on the templates
async function generateRandomProduct() {
  // Select random category
  const category = productCategories[Math.floor(Math.random() * productCategories.length)];
  
  // Select random template and description
  const template = category.templates[Math.floor(Math.random() * category.templates.length)];
  const description = category.descriptions[Math.floor(Math.random() * category.descriptions.length)];
  
  // Generate name by replacing {prefix} with the actual prefix
  const name = template.name.replace("{prefix}", category.prefix);
  
  // Generate final description by replacing {name} with the product name
  const finalDescription = description.replace("{name}", name);
  
  // Generate price
  const price = template.price();
  
  // Generate UPC
  const upc = generateUPC();
  
  // Create the product object
  const productData = {
    name: name,
    description: finalDescription,
    price: price,
    upc: upc,
  };

  try {
    // Create the product in the database
    const product = await createProduct(productData);
    
    // Generate and upload an image for the product
    const imageBuffer = generateProductImage(category);
    
    // Log the image creation process
    console.log(`Generated SVG image for product ${product.id} (${name}), category: ${category.category}, size: ${imageBuffer.length} bytes`);
    
    // Upload the SVG as the product image
    await uploadFile(product.id, imageBuffer, "image/svg+xml");
    
    console.log(`Successfully uploaded image for product ${product.id}`);
    
    return product;
  } catch (error) {
    console.error("Error generating random product:", error);
    throw error;
  }
}

module.exports = {
  generateRandomProduct,
};
