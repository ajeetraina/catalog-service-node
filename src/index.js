require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const fetch = require("node-fetch");
const ProductService = require("./services/ProductService");
const PublisherService = require("./services/PublisherService");
const multer = require("multer");

const app = express();
app.use(express.json());
const upload = multer({ dest: os.tmpdir() });

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get("/", (req, res) => {
  res.send("Catalog Service with AI Chatbot!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get("/metrics", (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP catalog_products_total Total number of products
# TYPE catalog_products_total counter
catalog_products_total 0

# HELP catalog_api_requests_total Total number of API requests
# TYPE catalog_api_requests_total counter
catalog_api_requests_total 0
  `);
});

app.get("/api/products", async (req, res) => {
  const products = await ProductService.getProducts();
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  try {
    const newProduct = await ProductService.createProduct(req.body);

    res
      .status(201)
      .header("Location", `/api/products/${newProduct.id}`)
      .json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const product = await ProductService.getProductById(req.params.id);

  if (!product) {
    res.status(404).send();
    return;
  }

  res.json(product);
});

app.get("/api/products/:id/image", async (req, res) => {
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
});

app.post("/api/products/:id/image", upload.single("file"), async (req, res) => {
  const product = await ProductService.uploadProductImage(
    req.params.id,
    fs.readFileSync(req.file.path),
  );

  res.json(product);
});

// Chat endpoint for AI chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get current products to provide context to the AI
    const products = await ProductService.getProducts();
    
    // Create a system prompt that gives the AI context about the product catalog
    const systemPrompt = `You are a helpful assistant for a product catalog service. You can help users with questions about our products, finding specific items, comparing products, and general shopping assistance.

Current products in our catalog:
${products.map(p => `- ${p.name}: ${p.description} (Price: $${p.price}, UPC: ${p.upc})`).join('\n')}

Please provide helpful, friendly responses about our products. If asked about products not in our catalog, let the user know that those items are not currently available but offer alternatives from our current selection if appropriate.`;

    const modelRunnerUrl = process.env.MODEL_RUNNER_URL || 'http://model-runner:8080';
    const model = process.env.MODEL_RUNNER_MODEL || 'ai/llama3.2:latest';

    // Prepare the request to Docker Model Runner
    const chatRequest = {
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    };

    console.log(`Sending request to Model Runner at ${modelRunnerUrl}`);

    // Send request to Docker Model Runner
    const response = await fetch(`${modelRunnerUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
      timeout: 30000
    });

    if (!response.ok) {
      console.error(`Model Runner error: ${response.status} ${response.statusText}`);
      throw new Error(`Model Runner request failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('Model Runner response:', aiResponse);

    // Extract the AI's response
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response right now.";

    res.json({
      response: assistantMessage,
      conversation_id: conversation_id || Date.now().toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: "Sorry, I'm having trouble responding right now. Please try again.",
      details: error.message 
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Catalog Service is running on port ${port}`);
  console.log(`Model Runner URL: ${process.env.MODEL_RUNNER_URL || 'http://model-runner:8080'}`);
  console.log(`Model: ${process.env.MODEL_RUNNER_MODEL || 'ai/llama3.2:latest'}`);
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await ProductService.teardown();
    await PublisherService.teardown();
    process.exit(0);
  });
});
