const { CatalogService } = require('../../../src/services/catalog');
const { KafkaProducer } = require('../../../src/services/kafka');

jest.mock('../../../src/services/kafka');

describe('CatalogService', () => {
  let catalogService;

  beforeEach(() => {
    catalogService = new CatalogService();
  });

  describe('createProduct', () => {
    it('should create a new product and publish event', async () => {
      const product = {
        name: 'Test Product',
        price: 99.99,
        description: 'A test product'
      };

      const result = await catalogService.createProduct(product);
      expect(result).toMatchObject(product);
      expect(KafkaProducer.prototype.send).toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should return list of products', async () => {
      const products = await catalogService.getProducts();
      expect(Array.isArray(products)).toBe(true);
    });
  });
});