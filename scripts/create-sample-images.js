/**
 * This script creates unique sample images for LocalStack S3 demo
 * It uses the AWS SDK directly rather than relying on AWS CLI
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Configure S3 client for LocalStack
const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || 'product-images';

// Create a colored SVG for a product
function generateColoredSvg(id, width = 300, height = 300) {
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
  <text x="${width/2}" y="${height/2 + 50}" font-family="Arial" font-size="20" fill="white" text-anchor="middle">LocalStack Demo</text>
</svg>`;
  
  return Buffer.from(svg);
}

// Ensure bucket exists
async function ensureBucketExists() {
  try {
    // First check if the bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    } catch (error) {
      // If bucket doesn't exist, create it
      console.log(`Creating bucket ${BUCKET_NAME}...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket exists: ${error.message}`);
    return false;
  }
}

// Upload sample images for products
async function uploadSampleImages() {
  // First make sure the bucket exists
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    console.error("Failed to ensure bucket exists. Please make sure LocalStack is running.");
    process.exit(1);
  }
  
  console.log('Uploading sample product images to LocalStack S3...');
  
  // Upload images for product IDs 1-10
  for (let id = 1; id <= 10; id++) {
    try {
      // Generate a unique SVG for this product
      const svgData = generateColoredSvg(id);
      
      // Upload to S3
      const key = `${id}/product.png`;
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: svgData,
        ContentType: 'image/svg+xml',
        CacheControl: 'no-cache, no-store, must-revalidate, max-age=0'
      }));
      
      console.log(`Uploaded unique image for product ${id}`);
    } catch (error) {
      console.error(`Error uploading image for product ${id}: ${error.message}`);
    }
  }
  
  console.log('Finished uploading sample images!');
}

// Run the script
console.log('Initializing LocalStack with sample product images...');
uploadSampleImages().then(() => {
  console.log('Done! Your LocalStack S3 bucket now contains unique images for each product.');
  console.log('You can now demo the application with properly working images.');
}).catch(err => {
  console.error('Error running script:', err);
});
