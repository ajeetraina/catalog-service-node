const TestContainers = require('../../setup/testcontainers');
const AWS = require('aws-sdk');

describe('AWS S3 Integration Tests', () => {
  let container;
  let s3;

  beforeAll(async () => {
    container = await TestContainers.startLocalStack();
    
    s3 = new AWS.S3({
      endpoint: process.env.AWS_ENDPOINT,
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      s3ForcePathStyle: true
    });
  });

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  it('should create and retrieve objects from S3', async () => {
    const bucketName = 'test-bucket';
    const key = 'test-object';
    const content = 'Hello, Testcontainers!';

    // Create bucket
    await s3.createBucket({ Bucket: bucketName }).promise();

    // Upload object
    await s3.putObject({
      Bucket: bucketName,
      Key: key,
      Body: content
    }).promise();

    // Retrieve object
    const response = await s3.getObject({
      Bucket: bucketName,
      Key: key
    }).promise();

    expect(response.Body.toString()).toBe(content);
  });
});