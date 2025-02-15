const request = require('supertest');
const { app } = require('../../../src/app');

describe('Products API', () => {
  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const product = {
        name: 'Integration Test Product',
        price: 199.99,
        description: 'Product created during integration test'
      };

      const response = await request(app)
        .post('/api/products')
        .send(product)
        .expect(201);

      expect(response.body).toMatchObject(product);
    });
  });
});