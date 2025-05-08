#!/usr/bin/env node

// This script initializes the LocalStack S3 bucket with sample images
// Run it with: node scripts/initialize-localstack.js

require('dotenv').config();
const {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  ListBucketsCommand,
  HeadBucketCommand
} = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Configure S3 client for LocalStack
const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL || "http://localhost:4566",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test"
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || "product-images";

// Function to create a simple colored SVG image
function generateColoredImage(color) {
  const width = 300;
  const height = 300;
  
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#FFFFFF" />
  <rect x="50" y="50" width="200" height="200" fill="${color}" />
</svg>`);
}

// Function to generate a sample image with product details
function generateProductImage(id, name, color) {
  const width = 300;
  const height = 300;
  
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#FFFFFF" />
  <rect x="20" y="20" width="260" height="260" fill="${color}" rx="20" ry="20" />
  <text x="150" y="150" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Product ${id}</text>
  <text x="150" y="180" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${name}</text>
</svg>`);
}

async function waitForS3() {
  console.log('Waiting for LocalStack S3 to be ready...');
  
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max wait time
  
  while (attempts < maxAttempts) {
    try {
      await s3Client.send(new ListBucketsCommand({}));
      console.log('LocalStack S3 is ready');
      return true;
    } catch (error) {
      process.stdout.write('.');
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('Timed out waiting for LocalStack S3');
  return false;
}

async function initializeS3() {
  try {
    // First wait for LocalStack to be ready
    const isReady = await waitForS3();
    if (!isReady) {
      throw new Error('LocalStack S3 not available');
    }
    
    // Try to list buckets to see if our bucket already exists
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    console.log('Available buckets:', Buckets?.map(b => b.Name) || 'none');
    
    const bucketExists = Buckets?.some(bucket => bucket.Name === BUCKET_NAME);
    
    // Create bucket if it doesn't exist
    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    } else {
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    }
    
    // Add sample colored images that can be used as product images
    const colors = [
      '#FF5252', // Red
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FFC107', // Amber
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#00BCD4', // Cyan
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#E91E63'  // Pink
    ];
    
    // Upload a placeholder image
    console.log('Uploading placeholder image...');
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: 'placeholder.png',
        Body: generateColoredImage('#CCCCCC'),
        ContentType: 'image/svg+xml',
      })
    );
    
    // Upload sample product images
    console.log('Uploading sample product images...');
    
    // Sample product names
    const productNames = [
      'EchoWave Sound Sphere',
      'Lumina Glow Cascade',
      'Zephyr Meditation Stone',
      'Chronos Memory Keeper',
      'Aetheria Inspiration Cube'
    ];
    
    // Upload a unique image for each possible product ID (1-10)
    for (let i = 1; i <= 10; i++) {
      const color = colors[i % colors.length];
      const name = productNames[(i - 1) % productNames.length];
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: `${i}/product.png`,
          Body: generateProductImage(i, name, color),
          ContentType: 'image/svg+xml',
          CacheControl: 'no-cache, no-store, must-revalidate',
        })
      );
      console.log(`Uploaded image for product ${i}`);
    }
    
    console.log('Initialization complete!');
    
  } catch (error) {
    console.error('Error initializing S3:', error);
  }
}

// Execute the initialization
initializeS3().then(() => {
  console.log('S3 initialization script completed');
});
