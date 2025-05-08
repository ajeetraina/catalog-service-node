#!/usr/bin/env node

// This script forces distinct images into LocalStack by using the AWS CLI directly
// It creates SVG images and uploads them to LocalStack

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Function to create a simple colored SVG image
function createColoredSvg(id, width = 200, height = 200) {
  // Get a color based on the ID (to ensure it's consistent but different)
  // This creates a vibrant, distinct color for each ID
  const hue = (id * 137) % 360; // Golden ratio hack for nice distribution
  const saturation = 80;
  const lightness = 50;
  
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="white" />
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="${color}" rx="20" ry="20" />
  <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">${id}</text>
</svg>`;
  
  const filePath = path.join(tempDir, `product-${id}.svg`);
  fs.writeFileSync(filePath, svg);
  
  return filePath;
}

// Create and upload distinct images for products
console.log('Creating and uploading distinct images for products...');
for (let id = 1; id <= 10; id++) {
  const imagePath = createColoredSvg(id);
  
  // Upload with correct content type and cache control headers
  console.log(`Uploading image for product ${id}...`);
  execSync(`aws --endpoint-url=${ENDPOINT} s3 cp "${imagePath}" "s3://${BUCKET_NAME}/${id}/product.png" --content-type "image/svg+xml" --cache-control "no-cache, no-store, must-revalidate, max-age=0"`);
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
