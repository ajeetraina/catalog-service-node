# Initialization Scripts

This directory contains scripts used to initialize and set up the application, particularly for local development environments.

## Fixing the "Same Images" Problem

If you're seeing the same bottle image for all products, use our force-distinct-images solution:

```bash
# Make sure LocalStack is running
docker compose up -d aws

# Run the force-distinct-images script (RECOMMENDED)
npm run force-images

# Restart your application
npm run dev
```

This script creates and uploads unique, colored PNG images for each product ID. Each image has:
- A distinct color based on the product ID
- The product ID number displayed in the center
- Proper cache control headers to prevent browser caching

## LocalStack Initialization

The `initialize-localstack.js` script sets up the LocalStack S3 bucket with sample product images.

### What the script does:

1. Waits for LocalStack to be available
2. Creates the `product-images` bucket if it doesn't exist
3. Uploads a placeholder image
4. Generates and uploads images for products with IDs 1-10
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

## Force Distinct Images Script

The `force-distinct-images.js` script is a more robust solution specifically designed to ensure each product has a visually distinct image.

### What this script does:

1. Creates actual PNG images with the Node.js canvas library
2. Each image has a unique color based on the product ID 
3. The product ID is prominently displayed in the center of the image
4. Images are uploaded directly to LocalStack using the AWS CLI
5. Proper cache-control headers are set to prevent browser caching

### Running the script:

```bash
# Run the force-distinct-images script
npm run force-images
```

## Troubleshooting Image Issues

If you're still seeing the same images for different products after running the force-images script:

1. **Hard Refresh the Browser**: Press Ctrl+F5 or Cmd+Shift+R to completely reload the page, bypassing the cache
2. **Open in Incognito/Private Mode**: This will start with a fresh cache
3. **Check the Network Tab**: In browser developer tools, look at the actual image requests
4. **Look at the Product ID**: Each image now displays its product ID at the bottom
5. **Inspect the Image URLs**: They should contain unique cache-busting parameters

### Common Issues:

1. **Service Worker Caching**: Some browsers may cache images at the service worker level. Try a different browser.
2. **Proxy Caching**: If you're using a proxy, it might be caching the images. Try disabling it.
3. **LocalStack Connection**: Ensure LocalStack is accessible at the URL specified in your `.env` file.
4. **AWS CLI**: The force-images script requires the AWS CLI to be installed and configured.

## Using Your Own Images

To add your own custom images for specific products:

```bash
# Using AWS CLI with LocalStack
aws --endpoint-url=http://localhost:4566 s3 cp your-image.png s3://product-images/1/product.png
```

Replace `1` with the product ID and `your-image.png` with the path to your image file.
