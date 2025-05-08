# Catalog Service Product Images

This guide explains how product images work with LocalStack in the Catalog Service application.

## How Product Images Work

The application uses LocalStack's S3 emulation to store and serve product images:

1. When you click "Upload" on a product, the app uploads an image to LocalStack's S3 emulation
2. When you view the catalog, the app fetches images from LocalStack
3. If an image doesn't exist, the app generates one automatically based on the product category

## Dynamic Image Generation

Each product gets a unique image based on its category (determined by the product name prefix):

- **Audio products** (EchoWave): Blue images with audio icon
- **Lighting products** (Lumina): Yellow images with light bulb icon
- **Wellness products** (Zephyr): Green images with wellness icon
- **Time products** (Chronos): Purple images with clock icon
- **Creativity products** (Aetheria): Red images with creativity icon

The images are lightweight SVGs (only a few KB each) that are generated on-the-fly when needed.

## Using LocalStack for Image Storage

The application demonstrates several LocalStack S3 features:

1. **Bucket Creation**: The app creates an S3 bucket if it doesn't exist
2. **Object Storage**: Images are stored as S3 objects 
3. **Content-Type Handling**: Different content types (SVG, PNG) are properly handled
4. **Metadata**: Version IDs and cache control headers are set
5. **Error Handling**: The app gracefully handles cases when objects don't exist

## Troubleshooting Image Issues

If images aren't displaying properly:

1. **Check LocalStack**: Make sure LocalStack is running
   ```bash
   docker compose ps
   # Ensure catalog-service-node-aws-1 is running
   ```

2. **Clear Browser Cache**: Sometimes browsers aggressively cache images
   ```
   # In Chrome: Hold Ctrl and click the refresh button
   # In Firefox: Hold Shift and click the refresh button
   ```

3. **Regenerate Images**: You can force regeneration of all product images:
   ```bash
   npm run create-images
   ```

4. **Check Logs**: Look for errors related to S3 or image retrieval
   ```bash
   docker compose logs aws
   ```

5. **Verify Image Storage**: Use AWS CLI to check if images exist in LocalStack
   ```bash
   AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 ls s3://product-images/
   ```

## Customizing Images

If you want to use different images:

1. **Modify ImageGenerator.js**: Change the SVG generation code to create different images
2. **Use Real Images**: You can upload real images through the UI or via AWS CLI
   ```bash
   AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test aws --endpoint-url=http://localhost:4566 s3 cp your-image.png s3://product-images/1/product.png
   ```
3. **Change Category Icons**: Update the icon paths in the categoryColors object in ImageGenerator.js

## How This Demonstrates LocalStack

This implementation shows how LocalStack can be used to:

1. **Emulate AWS S3**: Storing and retrieving objects just like in real AWS
2. **Handle Different Content Types**: Working with SVGs, PNGs, etc.
3. **Set Metadata and Headers**: Demonstrating cache control and versioning
4. **Create Resources Programmatically**: Creating buckets and objects with code
5. **Handle Error Conditions**: Dealing with missing buckets or objects

By using LocalStack for image storage, your demo shows a real-world use case of S3 emulation without requiring an actual AWS account.
