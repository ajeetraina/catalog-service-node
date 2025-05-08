const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  ListBucketsCommand
} = require("@aws-sdk/client-s3");
const { publishEvent } = require("./PublisherService");

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

async function getFile(id) {
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
      console.log(`Image not found for product ${id}, using placeholder`);
      return null;
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
    console.log("Creating placeholder image in S3 bucket...");
    
    // Small 1x1 transparent pixel PNG
    const transparentPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: "placeholder.png",
        Body: transparentPixel,
        ContentType: "image/png",
      }),
    );
    
    console.log("LocalStack S3 initialization complete");
  } catch (error) {
    console.error("Error ensuring bucket exists:", error.name, error.message);
    console.error("Full error:", error);
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
