require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const ProductService = require("./services/ProductService");
const PublisherService = require("./services/PublisherService");
const { generateRandomProduct } = require("./services/RandomProductGenerator");
const multer = require("multer");

const app = express();
app.use(express.json());
// Add CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Add cache-control headers for all responses
app.use((req, res, next) => {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

const upload = multer({ dest: os.tmpdir() });

app.get("/", (req, res) => {
  res.send("Hello World!!!");
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

// New endpoint to generate a random product
app.post("/api/random-product", async (req, res) => {
  try {
    const randomProduct = await generateRandomProduct();
    res
      .status(201)
      .header("Location", `/api/products/${randomProduct.id}`)
      .json(randomProduct);
  } catch (error) {
    console.error("Error generating random product:", error);
    res.status(500).json({ error: error.message });
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

  try {
    const imageStream = await ProductService.getProductImage(req.params.id);

    if (!imageStream) {
      res.status(404).send();
      return;
    }

    // Set cache control headers to prevent caching
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    
    // Determine content type - first try SVG, then fallback to PNG
    const key = `${req.params.id}/product.png`;
    
    // Default to SVG+XML for our generated images
    res.contentType("image/svg+xml");
    
    imageStream.pipe(res);
  } catch (error) {
    console.error("Error retrieving product image:", error);
    res.status(404).send();
  }
});

app.post("/api/products/:id/image", upload.single("file"), async (req, res) => {
  try {
    // Determine content type from file
    const contentType = req.file.mimetype || "image/png";
    
    const product = await ProductService.uploadProductImage(
      req.params.id,
      fs.readFileSync(req.file.path),
      contentType
    );

    res.json(product);
  } catch (error) {
    console.error("Error uploading product image:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, shutting down...`);
    await ProductService.teardown();
    await PublisherService.teardown();
    process.exit(0);
  });
});
