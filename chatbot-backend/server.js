const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables
const MODEL_RUNNER_URL = process.env.MODEL_RUNNER_URL || 'http://localhost:8080';
const MODEL_NAME = process.env.MODEL_NAME || 'ai/llama3.2:3B-Q8_0';
const CATALOG_API_URL = process.env.CATALOG_API_URL || 'http://localhost:3000';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get current product catalog
    let catalogData = [];
    try {
      const catalogResponse = await axios.get('/api/products');
      catalogData = catalogResponse.data;
    } catch (error) {
      console.log('Could not fetch catalog data, using sample context');
      catalogData = [
        { id: 1, name: "Sample Product", description: "A sample product", price: 100, upc: "123456789" }
      ];
    }

    // Prepare system context about the catalog
    const systemContext = `You are a helpful AI assistant for a product catalog system. You can help users find products, answer questions about the catalog, and provide product recommendations.

Current product catalog contains ${catalogData.length} products:
${catalogData.map(product => 
  `- ${product.name} (ID: ${product.id}): ${product.description} - Price: $${product.price}`
).join('\n')}

Please be helpful, friendly, and focus on the product catalog. If users ask about products not in the catalog, suggest they might want to add them or look for similar alternatives.`;

    // Build conversation history for the model
    const messages = [
      { role: 'system', content: systemContext },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call Docker Model Runner
    const modelResponse = await axios.post(`${MODEL_RUNNER_URL}/v1/chat/completions`, {
      model: MODEL_NAME,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: false
    });

    const aiResponse = modelResponse.data.choices[0].message.content;

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
      model: MODEL_NAME
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    
    // Fallback response if AI service is unavailable
    const fallbackResponse = getFallbackResponse(req.body.message);
    
    res.json({
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      model: 'fallback',
      error: 'AI service temporarily unavailable'
    });
  }
});

// Fallback responses when AI is unavailable
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('product') || lowerMessage.includes('catalog')) {
    return "I can help you with our product catalog! You can browse products above, add new products, or ask me specific questions about our inventory.";
  } else if (lowerMessage.includes('price')) {
    return "Product prices are displayed in the catalog above. You can also create new products with custom pricing.";
  } else if (lowerMessage.includes('help')) {
    return "I'm here to help you with the product catalog! You can:\n- Browse existing products\n- Add new products\n- Ask me questions about inventory\n- Get product recommendations";
  } else {
    return "Thanks for your message! I'm a catalog assistant. Feel free to ask me about products, pricing, or inventory management.";
  }
}

// Get catalog stats endpoint
app.get('/api/catalog-stats', async (req, res) => {
  try {
    const catalogResponse = await axios.get(`${CATALOG_API_URL}/api/products`);
    const products = catalogResponse.data;
    
    const stats = {
      totalProducts: products.length,
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
      categories: [...new Set(products.map(p => p.category || 'General'))],
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Unable to fetch catalog stats',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Chatbot backend running on port ${PORT}`);
  console.log(`Model Runner URL: ${MODEL_RUNNER_URL}`);
  console.log(`Using model: ${MODEL_NAME}`);
});
