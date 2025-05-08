require("dotenv").config();
const os = require("os");
const fs = require("fs");
const express = require("express");
const ProductService = require("./services/ProductService");
const PublisherService = require("./services/PublisherService");
const { generateRandomProduct } = require("./services/RandomProductGenerator");
const DirectImageService = require("./services/DirectImageService");
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
  const productId = req.params.id;
  console.log(`Getting image for product ${productId}`);

  try {
    // Use our DirectImageService instead of S3
    const image = DirectImageService.getImage(productId);
    
    if (!image) {
      console.log(`No image found for product ${productId}`);
      res.status(404).send();
      return;
    }

    // Set cache control headers to prevent caching
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    
    // Set content type from the image metadata
    res.contentType(image.contentType);
    
    // Send the image data
    res.send(image.data);
    
    // Update the product has_image flag in the background
    ProductService.markProductHasImage(productId).catch(err => {
      console.error(`Error updating has_image flag for product ${productId}:`, err);
    });
    
  } catch (error) {
    console.error(`Error retrieving product image for ${productId}:`, error);
    res.status(500).send(`Error retrieving image: ${error.message}`);
  }
});

app.post("/api/products/:id/image", upload.single("file"), async (req, res) => {
  const productId = req.params.id;
  
  try {
    // Read the uploaded file
    const fileData = fs.readFileSync(req.file.path);
    const contentType = req.file.mimetype || "image/png";
    
    // Store it directly with our DirectImageService
    DirectImageService.storeImage(productId, fileData, contentType);
    
    // Update the product in the database
    const product = await ProductService.markProductHasImage(productId);
    
    res.json(product);
  } catch (error) {
    console.error(`Error uploading image for product ${productId}:`, error);
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
