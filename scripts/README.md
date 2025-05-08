# Initialization Scripts

This directory contains scripts used to initialize and set up the application, particularly for local development environments.

## LocalStack Initialization

The `initialize-localstack.js` script sets up the LocalStack S3 bucket with sample product images.

### What the script does:

1. Waits for LocalStack to be available
2. Creates the `product-images` bucket if it doesn't exist
3. Uploads a placeholder image
4. Generates and uploads unique colored images for products with IDs 1-10
5. Sets proper cache-control headers on all images

### Running the script:

```bash
# Make sure LocalStack is running
docker compose up -d aws

# Run the initialization script
npm run init-localstack
```

Or you can use the combined setup command:

```bash
npm run setup
```

## Troubleshooting Image Issues

If you're still seeing the same images for different products, try these steps:

1. Restart the application: `npm run dev`
2. Reinitialize the LocalStack S3 bucket: `npm run init-localstack`
3. Clear your browser cache or use incognito/private browsing
4. Click on an image in the product table to force a reload
5. Check the browser's developer tools (Network tab) to ensure new images are being requested

### Common Issues:

1. **Browser Caching**: Browsers aggressively cache images. The application includes cache-busting parameters in image URLs, but you may need to manually clear your browser cache.

2. **LocalStack Connection**: Ensure LocalStack is running and accessible at the URL specified in your `.env` file (typically `http://localhost:4566`).

3. **S3 Bucket Name**: The default bucket name is `product-images`. If you've changed this in your `.env` file, make sure the initialization script uses the same name.

4. **File Permissions**: If running in a Docker environment, ensure the containers have proper permissions to access and write to the S3 bucket.

5. **Error Logs**: Check the application logs for any S3-related errors.

## Adding Your Own Images

To add your own custom images to the S3 bucket:

```bash
# Using AWS CLI with LocalStack
aws --endpoint-url=http://localhost:4566 s3 cp your-image.png s3://product-images/1/product.png
```

Replace `1` with the product ID and `your-image.png` with the path to your image file.
