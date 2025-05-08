const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { publishEvent } = require("./PublisherService");

const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.PRODUCT_IMAGE_BUCKET_NAME || "product-images";

async function getFile(id) {
  const name = "product.png";

  try {
    // Check if the file exists first
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${id}/${name}`,
      }),
    );

    const result = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${id}/${name}`,
      }),
    );

    return result.Body;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
      // File doesn't exist, but we don't want to crash the application
      console.log(`Image not found for product ${id}, using placeholder`);
      
      // For now, return null to indicate no image
      return null;
    }
    // For other errors, rethrow to be handled by the caller
    throw error;
  }
}

async function uploadFile(id, buffer) {
  const name = "product.png";

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${id}/${name}`,
      Body: buffer,
    }),
  );

  const details = {
    action: "image_uploaded",
    product_id: id,
    filename: name,
  };

  await publishEvent("products", details);

  return details;
}

// Creates a default placeholder image for products that don't have one
async function ensureBucketExists() {
  try {
    // Check if bucket exists, create if not
    console.log(`Ensuring bucket ${BUCKET_NAME} exists...`);
    
    // There's no direct "create bucket if not exists" in the JS SDK
    // So we'll try to access it and create it if it fails
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: BUCKET_NAME,
          Key: "placeholder.png",
        }),
      );
    } catch (error) {
      // The error could be bucket doesn't exist or just the file doesn't exist
      // For simplicity, let's try to create a placeholder image
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
        }),
      );
    }
  } catch (error) {
    console.error("Error ensuring bucket exists:", error);
  }
}

// Call this when the application starts
ensureBucketExists().catch(console.error);

module.exports = {
  uploadFile,
  getFile,
};
