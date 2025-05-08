const { createProduct } = require("./ProductService");
const DirectImageService = require("./DirectImageService");

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
    
    console.log(`Created random product: ${name} (ID: ${product.id})`);
    
    // After the product is created, the ID will be automatically be used by DirectImageService
    // to generate a unique image for the product
    
    // Update the product to indicate it has an image
    require("./ProductService").markProductHasImage(product.id);
    
    return product;
  } catch (error) {
    console.error("Error generating random product:", error);
    throw error;
  }
}

module.exports = {
  generateRandomProduct,
};
