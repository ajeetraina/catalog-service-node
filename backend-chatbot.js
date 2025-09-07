require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const ProductService = require("./src/services/ProductService");
const PublisherService = require("./src/services/PublisherService");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: os.tmpdir() });

// Environment variables
const PORT = process.env.PORT || 8080;
const METRICS_PORT = process.env.METRICS_PORT || 9090;
const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME || 'ai/llama3.2:3B-Q8_0';

// In-memory conversation storage (in production, use Redis or database)
const conversations = new Map();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "catalog-chatbot-backend"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "AI-Enhanced Product Catalog API",
    version: "1.0.0",
    features: ["Product Management", "AI Chatbot", "Real-time Chat"]
  });
});

// ==================== EXISTING CATALOG ENDPOINTS ====================

app.get("/api/products", async (req, res) => {
  try {
    const products = await ProductService.getProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const newProduct = await ProductService.createProduct(req.body);
    res
      .status(201)
      .header("Location", `/api/products/${newProduct.id}`)
      .json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get("/api/products/:id/image", async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) {
      res.status(404).send();
      return;
    }

    const imageStream = await ProductService.getProductImage(req.params.id);
    if (!imageStream) {
      res.status(404).send();
      return;
    }

    res.contentType("image/png");
    imageStream.pipe(res);
  } catch (error) {
    console.error('Error fetching product image:', error);
    res.status(500).json({ error: 'Failed to fetch product image' });
  }
});

app.post("/api/products/:id/image", upload.single("file"), async (req, res) => {
  try {
    const product = await ProductService.uploadProductImage(
      req.params.id,
      fs.readFileSync(req.file.path),
    );
    res.json(product);
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({ error: 'Failed to upload product image' });
  }
});

// ==================== NEW CHATBOT ENDPOINTS ====================

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationId = 'default', conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get current product catalog for context
    let catalogData = [];
    try {
      catalogData = await ProductService.getProducts();
    } catch (error) {
      console.log('Could not fetch catalog data for chat context');
      catalogData = [];
    }

    // Prepare system context about the catalog
    const systemContext = `You are a helpful AI assistant for a product catalog system. You can help users find products, answer questions about the catalog, and provide product recommendations.

Current product catalog contains ${catalogData.length} products:
${catalogData.map(product => 
  `- ${product.name} (ID: ${product.id}): ${product.description || 'No description'} - Price: $${product.price || 'N/A'} - UPC: ${product.upc || 'N/A'}`
).join('\n')}

Please be helpful, friendly, and focus on the product catalog. If users ask about products not in the catalog, suggest they might want to add them or look for similar alternatives. You can also help with:
- Finding specific products
- Price comparisons
- Product recommendations
- Inventory questions
- Adding new products guidance`;

    // Build messages for the model
    const messages = [
      { role: 'system', content: systemContext },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // Call the LLM model (Docker Model Runner)
    let aiResponse;
    try {
      const modelResponse = await fetch('http://llm:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_MODEL_NAME,
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        })
      });

      if (!modelResponse.ok) {
        throw new Error(`Model API error: ${modelResponse.status}`);
      }

      const modelData = await modelResponse.json();
      aiResponse = modelData.choices[0].message.content;

    } catch (error) {
      console.error('LLM API error:', error.message);
      
      // Fallback response when AI is unavailable
      aiResponse = getFallbackResponse(message, catalogData);
    }

    // Store conversation (simple in-memory storage)
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }
    const conversation = conversations.get(conversationId);
    conversation.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    );

    res.json({
      response: aiResponse,
      conversationId,
      timestamp: new Date().toISOString(),
      model: LLM_MODEL_NAME
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Chat service temporarily unavailable',
      fallback: 'Please try again or browse the catalog manually.'
    });
  }
});

// Get catalog stats for chatbot context
app.get("/api/catalog-stats", async (req, res) => {
  try {
    const products = await ProductService.getProducts();
    
    const stats = {
      totalProducts: products.length,
      averagePrice: products.length > 0 ? 
        (products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length).toFixed(2) : 0,
      priceRange: products.length > 0 ? {
        min: Math.min(...products.map(p => p.price || 0)),
        max: Math.max(...products.map(p => p.price || 0))
      } : { min: 0, max: 0 },
      hasImages: products.filter(p => p.image_url).length,
      timestamp: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting catalog stats:', error);
    res.status(500).json({ 
      error: 'Unable to fetch catalog stats',
      timestamp: new Date().toISOString()
    });
  }
});

// Get conversation history
app.get("/api/conversations/:id", (req, res) => {
  const conversationId = req.params.id;
  const conversation = conversations.get(conversationId) || [];
  res.json({
    conversationId,
    messages: conversation,
    count: conversation.length
  });
});

// Clear conversation
app.delete("/api/conversations/:id", (req, res) => {
  const conversationId = req.params.id;
  conversations.delete(conversationId);
  res.json({
    message: `Conversation ${conversationId} cleared`,
    timestamp: new Date().toISOString()
  });
});

// ==================== HELPER FUNCTIONS ====================

function getFallbackResponse(message, catalogData) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('product') || lowerMessage.includes('catalog')) {
    if (catalogData.length > 0) {
      return `I can help you with our product catalog! We currently have ${catalogData.length} products available. You can browse them above, add new products, or ask me specific questions about our inventory.`;
    } else {
      return "I can help you with the product catalog! Currently, there are no products in the catalog, but you can start by adding some products using the 'Create product' button above.";
    }
  } else if (lowerMessage.includes('price')) {
    if (catalogData.length > 0) {
      const avgPrice = (catalogData.reduce((sum, p) => sum + (p.price || 0), 0) / catalogData.length).toFixed(2);
      return `Product prices are displayed in the catalog above. The average price of our ${catalogData.length} products is $${avgPrice}. You can also create new products with custom pricing.`;
    } else {
      return "Product prices will be displayed in the catalog once you add some products. You can create new products with custom pricing using the form above.";
    }
  } else if (lowerMessage.includes('help')) {
    return "I'm here to help you with the product catalog! You can:\n• Browse existing products\n• Add new products\n• Ask me questions about inventory\n• Get product recommendations\n• Learn about pricing and product details";
  } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI catalog assistant. I can help you manage products, answer questions about inventory, and provide recommendations. How can I assist you today?";
  } else {
    return "Thanks for your message! I'm your catalog assistant. Feel free to ask me about products, pricing, inventory management, or anything related to the catalog. I'm here to help!";
  }
}

// ==================== METRICS ENDPOINT ====================

// Basic metrics endpoint for Prometheus
app.get("/metrics", (req, res) => {
  const metrics = `
# HELP catalog_products_total Total number of products in catalog
# TYPE catalog_products_total gauge
catalog_products_total ${ProductService.getProductCount ? ProductService.getProductCount() : 0}

# HELP catalog_api_requests_total Total number of API requests
# TYPE catalog_api_requests_total counter
catalog_api_requests_total ${global.requestCount || 0}

# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP nodejs_uptime_seconds Process uptime in seconds
# TYPE nodejs_uptime_seconds gauge
nodejs_uptime_seconds ${process.uptime()}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Request counter middleware
app.use((req, res, next) => {
  global.requestCount = (global.requestCount || 0) + 1;
  next();
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, () => {
  console.log(`🚀 AI-Enhanced Catalog Server running on port ${PORT}`);
  console.log(`📊 Metrics available on port ${METRICS_PORT} at /metrics`);
  console.log(`🤖 Using AI model: ${LLM_MODEL_NAME}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - Products: http://localhost:${PORT}/api/products`);
  console.log(`   - Chat: http://localhost:${PORT}/api/chat`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
});

// Metrics server
const metricsServer = require('http').createServer((req, res) => {
  if (req.url === '/metrics') {
    app.handle({ url: '/metrics', method: 'GET' }, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

metricsServer.listen(METRICS_PORT, () => {
  console.log(`📈 Metrics server running on port ${METRICS_PORT}`);
});

// Graceful shutdown
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    
    server.close(() => {
      console.log('HTTP server closed');
    });
    
    metricsServer.close(() => {
      console.log('Metrics server closed');
    });
    
    try {
      await ProductService.teardown();
      await PublisherService.teardown();
      console.log('Services shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    
    process.exit(0);
  });
});
