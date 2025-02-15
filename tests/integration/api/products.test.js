const request = require('supertest');
const TestContainers = require('../../setup/testcontainers');
const { app } = require('../../../src/app');

describe('Products API Integration Tests', () => {
  let containers;

  beforeAll(async () => {
    containers = await TestContainers.startAll();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for services to be ready
  });

  afterAll(async () => {
    if (containers) {
      await containers.kafka.stop();
      await containers.localstack.stop();
    }
  });

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product and publish to Kafka', async () => {
      const product = {
        name: 'Test Product',
        price: 199.99,
        description: 'Product created during integration test'
      };

      const response = await request(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body).toMatchObject(product);
      
      // Verify Kafka message
      // Implementation depends on your Kafka consumer setup
    });
  });
});