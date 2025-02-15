# Unit Testing

## Running Unit Tests

We use Jest as our testing framework. To run the unit tests:

```bash
npm run test:unit
```

!!! tip "Watch Mode"
    During development, you can run tests in watch mode:
    ```bash
    npm run test:unit:watch
    ```

## Test Structure

```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── models/
└── __mocks__/
```

## Writing Unit Tests

=== "Service Test"
    ```javascript
    describe('CatalogService', () => {
      it('should create a new product', async () => {
        // Test implementation
      });
    });
    ```

=== "Controller Test"
    ```javascript
    describe('CatalogController', () => {
      it('should return product list', async () => {
        // Test implementation
      });
    });
    ```

!!! warning "Mocking Dependencies"
    Remember to mock external dependencies:
    ```javascript
    jest.mock('../../src/services/kafka');
    ```

## Code Coverage

To generate a code coverage report:

```bash
npm run test:coverage
```

The report will be available in the `coverage` directory.
