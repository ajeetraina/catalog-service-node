/**
 * ChatbotService.js
 * This service provides AI assistant functionality for the product catalog
 */

const { getProducts, createProduct, getProductById, uploadProductImage } = require('./ProductService');
const { generateColoredSvg } = require('./ImageGenerator');

// Categories for product generation
const CATEGORIES = {
  AUDIO: 'EchoWave',
  LIGHTING: 'Lumina',
  WELLNESS: 'Zephyr', 
  TIME: 'Chronos',
  CREATIVITY: 'Aetheria'
};

// Generate a product name based on category
function generateProductName(category) {
  // Generate suffixes based on category
  const suffixes = {
    [CATEGORIES.AUDIO]: ['Speaker', 'Headphones', 'Amplifier', 'Soundbar', 'Microphone'],
    [CATEGORIES.LIGHTING]: ['Lamp', 'Fixture', 'Bulb', 'Lantern', 'Spotlight'],
    [CATEGORIES.WELLNESS]: ['Diffuser', 'Massager', 'Purifier', 'Monitor', 'Tracker'],
    [CATEGORIES.TIME]: ['Watch', 'Clock', 'Timer', 'Calendar', 'Reminder'],
    [CATEGORIES.CREATIVITY]: ['Pen', 'Canvas', 'Tablet', 'Brush', 'Stylus']
  };
  
  // Get random suffix for the category
  const categoryItems = suffixes[category] || suffixes[CATEGORIES.AUDIO];
  const randomSuffix = categoryItems[Math.floor(Math.random() * categoryItems.length)];
  
  // Generate a model number
  const modelNumber = Math.floor(Math.random() * 1000);
  
  return `${category} ${randomSuffix} ${modelNumber}`;
}

// Generate a product description based on category and name
function generateProductDescription(category, name) {
  const templates = {
    [CATEGORIES.AUDIO]: `Experience exceptional audio quality with the ${name}. This premium audio device offers crystal-clear sound reproduction, advanced noise cancellation, and seamless wireless connectivity. Perfect for music enthusiasts and professionals alike.`,
    
    [CATEGORIES.LIGHTING]: `Illuminate your space with the innovative ${name}. Featuring adjustable brightness levels, energy-efficient LED technology, and a sleek modern design. Transform any room with this versatile lighting solution.`,
    
    [CATEGORIES.WELLNESS]: `Enhance your wellbeing with the state-of-the-art ${name}. Designed with your health in mind, this product combines cutting-edge technology with user-friendly features to create a more balanced lifestyle.`,
    
    [CATEGORIES.TIME]: `Master your time with the precision-engineered ${name}. Blending traditional craftsmanship with modern technology, this timepiece offers reliability, accuracy, and elegant design for the discerning user.`,
    
    [CATEGORIES.CREATIVITY]: `Unleash your creativity with the innovative ${name}. This versatile tool provides the perfect balance of precision and flexibility, allowing you to bring your artistic vision to life with ease.`
  };
  
  return templates[category] || templates[CATEGORIES.AUDIO];
}

// Generate a random UPC code
function generateUPC() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

// Generate a random price within a range
function generatePrice(min = 50, max = 300) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

// Generate all product details at once
async function generateProductDetails(category) {
  // Validate category
  if (!Object.values(CATEGORIES).includes(category)) {
    category = CATEGORIES.AUDIO; // Default to audio if invalid category
  }
  
  // Generate product name
  const name = generateProductName(category);
  
  // Generate remaining details
  const details = {
    name,
    description: generateProductDescription(category, name),
    upc: generateUPC(),
    price: generatePrice(),
    category: category
  };
  
  return details;
}

// Create a new product with the generated details
async function createProductWithGeneratedDetails(category) {
  try {
    // Generate product details
    const productDetails = await generateProductDetails(category);
    
    // Create the product
    const newProduct = await createProduct(productDetails);
    
    return { success: true, product: newProduct };
  } catch (error) {
    console.error('Error creating product with generated details:', error);
    return { success: false, error: error.message };
  }
}

// Process message from chatbot
async function processChatbotMessage(message, context = {}) {
  const lowerMessage = message.toLowerCase();
  let response = {
    text: '',
    suggestions: [],
    data: null
  };
  
  // Handle different intents
  if (lowerMessage.includes('add') && lowerMessage.includes('product')) {
    // Intent: Add a new product
    response.text = "I can help you add a new product! Which category would you like to create?";
    response.suggestions = Object.values(CATEGORIES).map(cat => cat);
    response.intent = 'add_product';
  } 
  else if (Object.values(CATEGORIES).some(cat => lowerMessage.includes(cat.toLowerCase()))) {
    // Intent: Selected a category
    const category = Object.values(CATEGORIES).find(cat => lowerMessage.includes(cat.toLowerCase()));
    if (category) {
      try {
        response.text = `Generating a ${category} product for you...`;
        response.intent = 'generating_product';
        
        // Generate product details
        const productDetails = await generateProductDetails(category);
        
        response.data = productDetails;
        response.text = `I've generated details for a new ${category} product:\n\n` +
                       `Name: ${productDetails.name}\n` +
                       `UPC: ${productDetails.upc}\n` +
                       `Price: $${productDetails.price}\n\n` +
                       `Description: ${productDetails.description}\n\n` +
                       `Would you like to add this product to the catalog?`;
        response.suggestions = ['Yes, add this product', 'Generate another product', 'No, cancel'];
      } catch (error) {
        response.text = `Sorry, I had trouble generating a ${category} product. Please try again.`;
        response.error = error.message;
      }
    }
  }
  else if (lowerMessage.includes('yes') && (lowerMessage.includes('add') || context.intent === 'generating_product')) {
    // Intent: Confirm product creation
    if (context.data) {
      try {
        const newProduct = await createProduct({
          name: context.data.name,
          upc: context.data.upc,
          price: parseFloat(context.data.price),
          description: context.data.description
        });
        
        response.text = `? Success! I've added the product "${newProduct.name}" to the catalog.\n` +
                       `Product ID: ${newProduct.id}\n\n` +
                       `Would you like to upload an image for this product?`;
        response.data = newProduct;
        response.intent = 'product_created';
        response.suggestions = ['Yes, upload an image', 'No, I\'m done'];
      } catch (error) {
        response.text = `Sorry, I couldn't create the product. Error: ${error.message}`;
        response.error = error.message;
      }
    } else {
      response.text = "I don't have any product details to add. Let's start again - which category of product would you like to create?";
      response.suggestions = Object.values(CATEGORIES);
    }
  }
  else if (lowerMessage.includes('view') && lowerMessage.includes('product')) {
    // Intent: View products
    try {
      const products = await getProducts();
      
      if (products.length === 0) {
        response.text = "There are no products in the catalog yet. Would you like to add one?";
        response.suggestions = ['Add a new product'];
      } else {
        const productListText = products.map(p => 
          `- Product #${p.id}: ${p.name} - $${p.price} ${p.has_image ? '(Has image)' : ''}`
        ).join('\n');
        
        response.text = `Here are the products in the catalog:\n\n${productListText}\n\nWhat would you like to do next?`;
        response.data = products;
        response.suggestions = ['Add a new product', 'Upload an image for a product'];
      }
    } catch (error) {
      response.text = `Sorry, I couldn't retrieve the products. Error: ${error.message}`;
      response.error = error.message;
    }
  }
  else if (lowerMessage.includes('upload') && lowerMessage.includes('image')) {
    // Intent: Upload image
    try {
      const products = await getProducts();
      
      if (products.length === 0) {
        response.text = "There are no products in the catalog to upload an image for. Would you like to add a product first?";
        response.suggestions = ['Add a new product'];
      } else {
        response.text = "I can help you upload an image! For which product would you like to upload an image?";
        response.data = products;
        response.intent = 'upload_image';
        response.suggestions = products.map(p => `Product #${p.id}: ${p.name}`);
      }
    } catch (error) {
      response.text = `Sorry, I couldn't retrieve the products. Error: ${error.message}`;
      response.error = error.message;
    }
  }
  else if (lowerMessage.match(/product #(\d+)/i) && context.intent === 'upload_image') {
    // Intent: Selected a product for image upload
    const productId = lowerMessage.match(/product #(\d+)/i)[1];
    
    response.text = `Please upload an image for product #${productId}.`;
    response.data = { productId };
    response.intent = 'awaiting_image';
  }
  else if (lowerMessage.includes('generate') && lowerMessage.includes('description')) {
    // Intent: Generate product description
    response.text = "I can generate a product description! Which category is this for?";
    response.suggestions = Object.values(CATEGORIES);
    response.intent = 'generate_description';
  }
  else if (context.intent === 'generate_description' && Object.values(CATEGORIES).some(cat => lowerMessage.includes(cat.toLowerCase()))) {
    // Intent: Generate description for specific category
    const category = Object.values(CATEGORIES).find(cat => lowerMessage.includes(cat.toLowerCase()));
    
    if (category) {
      const mockName = generateProductName(category);
      const description = generateProductDescription(category, mockName);
      
      response.text = `Here's a sample description for a ${category} product:\n\n${description}`;
      response.data = { description };
    }
  }
  else if (lowerMessage.includes('help')) {
    // Intent: Help
    response.text = "I can help you with the following tasks:\n\n" +
                   "- Adding new products to the catalog\n" +
                   "- Generating product details (names, descriptions, prices)\n" +
                   "- Uploading images for products\n" +
                   "- Viewing existing products\n\n" +
                   "What would you like to do?";
    response.suggestions = ['Add a new product', 'View products', 'Upload an image', 'Generate a product description'];
  }
  else {
    // Default fallback response
    response.text = "I'm your catalog assistant. I can help you manage products and product images. What would you like to do?";
    response.suggestions = ['Add a new product', 'View products', 'Upload an image', 'Help'];
  }
  
  return response;
}

module.exports = {
  generateProductDetails,
  createProductWithGeneratedDetails,
  processChatbotMessage,
  CATEGORIES
};
