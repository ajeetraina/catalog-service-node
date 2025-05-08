const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  ListBucketsCommand
} = require("@aws-sdk/client-s3");
const { publishEvent } = require("./PublisherService");
const { generateColoredSvg } = require("./ImageGenerator");

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

async function getFile(id, productName = '') {
  const name = "product.png";
  const key = `${id}/${name}`;

  try {
    console.log(`Getting file from S3: bucket=${BUCKET_NAME}, key=${key}`);
    
    // Try to get the object from S3
    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
    );

    console.log(`Successfully retrieved file for product ${id}`);
    return result.Body;
  } catch (error) {
    console.error(`Error getting file for product ${id}:`, error.name, error.message);
    
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      console.log(`Image not found for product ${id}, generating one on-the-fly`);
      
      // Generate a sample image using the SVG generation code
      try {
        const svgData = generateColoredSvg(id, productName);
        
        // Upload the generated image to S3
        await uploadFile(id, svgData, 'image/svg+xml');
        
        // Now try to get it again
        const result = await s3Client.send(
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          }),
        );
        
        console.log(`Generated and retrieved file for product ${id}`);
        return result.Body;
      } catch (genError) {
        console.error(`Failed to generate image for product ${id}:`, genError);
        return null;
      }
    }
    
    // For other errors, rethrow to be handled by the caller
    throw error;
  }
}

async function uploadFile(id, buffer, contentType = "image/png") {
  const name = "product.png";
  const key = `${id}/${name}`;
  
  console.log(`Uploading image for product ${id}, buffer size: ${buffer.length}, type: ${contentType}`);
  console.log(`Target S3 location: bucket=${BUCKET_NAME}, key=${key}`);

  try {
    // Generate a unique version ID to prevent caching
    const versionId = Date.now().toString();
    
    // Ensure bucket exists
    await ensureBucketExists();
    
    // Upload the file to S3
    const uploadResult = await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          'version-id': versionId,
        },
        // Add cache-control to prevent browser caching
        CacheControl: "no-cache, no-store, must-revalidate",
      }),
    );

    console.log(`Successfully uploaded image for product ${id}`, uploadResult);

    const details = {
      action: "image_uploaded",
      product_id: id,
      filename: name,
      version_id: versionId,
    };

    await publishEvent("products", details);

    return details;
  } catch (error) {
    console.error(`Error uploading file for product ${id}:`, error.name, error.message);
    throw error;
  }
}

// Creates the S3 bucket if it doesn't exist and adds a placeholder image
async function ensureBucketExists() {
  try {
    console.log(`Ensuring bucket ${BUCKET_NAME} exists in LocalStack...`);
    
    // Try to list buckets to see if bucket already exists
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    const bucketExists = Buckets?.some(bucket => bucket.Name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Bucket ${BUCKET_NAME} does not exist, creating it now...`);
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: BUCKET_NAME
        })
      );
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    } else {
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    }
    
    // Add a placeholder image
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: "placeholder.png",
        }),
      );
    } catch (error) {
      console.log("Creating placeholder image in S3 bucket...");
      const placeholderSvg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#f5f5f5" />
  <rect x="20" y="20" width="260" height="260" rx="20" fill="#dddddd" />
  <text x="150" y="150" font-family="Arial" font-size="24" fill="#555555" text-anchor="middle">LocalStack Demo</text>
  <text x="150" y="190" font-family="Arial" font-size="18" fill="#555555" text-anchor="middle">Product Image</text>
</svg>`;
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: "placeholder.png",
          Body: Buffer.from(placeholderSvg),
          ContentType: "image/svg+xml",
        }),
      );
    }
    
    console.log("LocalStack S3 initialization complete");
    return true;
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
    return false;
  }
}

// Call this when the application starts
console.log("Initializing S3 storage service with LocalStack...");
ensureBucketExists().catch(error => {
  console.error("Failed to initialize S3 bucket:", error);
});

module.exports = {
  uploadFile,
  getFile,
  ensureBucketExists, // Export for testing purposes
};
