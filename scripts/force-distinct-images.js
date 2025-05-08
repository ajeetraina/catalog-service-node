#!/usr/bin/env node

// This script forces distinct images into LocalStack by using the AWS CLI directly
// It creates a new set of png files locally and uploads them to LocalStack

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Make sure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// LocalStack endpoint
const ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || 'product-images';

// Create bucket if it doesn't exist
console.log(`Ensuring bucket ${BUCKET_NAME} exists...`);
try {
  execSync(`aws --endpoint-url=${ENDPOINT} s3api head-bucket --bucket ${BUCKET_NAME}`, { stdio: 'ignore' });
  console.log(`Bucket ${BUCKET_NAME} already exists`);
} catch (error) {
  console.log(`Creating bucket ${BUCKET_NAME}...`);
  execSync(`aws --endpoint-url=${ENDPOINT} s3api create-bucket --bucket ${BUCKET_NAME}`);
}

// Function to create a simple colored PNG image
function createColoredImage(id, width = 200, height = 200) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Get a color based on the ID (to ensure it's consistent but different)
  // This creates a vibrant, distinct color for each ID
  const hue = (id * 137) % 360; // Golden ratio hack for nice distribution
  const saturation = 80;
  const lightness = 50;
  
  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  // Main colored rectangle
  ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  ctx.fillRect(20, 20, width - 40, height - 40);
  
  // Add product ID number
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(id.toString(), width/2, height/2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(tempDir, `product-${id}.png`);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

// Create and upload distinct images for products
console.log('Creating and uploading distinct images for products...');
for (let id = 1; id <= 10; id++) {
  const imagePath = createColoredImage(id);
  
  // Upload with correct content type and cache control headers
  console.log(`Uploading image for product ${id}...`);
  execSync(`aws --endpoint-url=${ENDPOINT} s3 cp "${imagePath}" "s3://${BUCKET_NAME}/${id}/product.png" --content-type "image/png" --cache-control "no-cache, no-store, must-revalidate, max-age=0"`);
}

console.log('All images uploaded successfully!');
console.log('Listing bucket contents to verify:');
execSync(`aws --endpoint-url=${ENDPOINT} s3 ls "s3://${BUCKET_NAME}/" --recursive`, { stdio: 'inherit' });

// Clean up temp files
console.log('Cleaning up temporary files...');
fs.readdirSync(tempDir).forEach(file => {
  fs.unlinkSync(path.join(tempDir, file));
});
fs.rmdirSync(tempDir);

console.log('Done!');
