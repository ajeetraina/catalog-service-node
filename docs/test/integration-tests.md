# Integration Testing

## Running Integration Tests

Integration tests require the services to be running. Make sure to start the environment first:

```bash
docker compose up -d
npm run test:integration
```

!!! warning "Prerequisites"
    Ensure all services are running before executing integration tests:
    - Kafka
    - LocalStack
    - Catalog Service

## Test Structure

```
tests/
├── integration/
│   ├── api/
│   ├── kafka/
│   └── aws/
└── __fixtures__/
```

## API Tests

=== "REST Endpoints"
    ```javascript
    describe('GET /api/products', () => {
      it('should return list of products', async () => {
        const response = await request(app)
          .get('/api/products')
          .expect(200);
        
        expect(response.body).toHaveLength(2);
      });
    });
    ```

=== "Kafka Integration"
    ```javascript
    describe('Kafka Producer', () => {
      it('should publish product updates', async () => {
        // Test implementation
      });
    });
    ```

## Environment Setup

!!! info "Test Environment"
    Integration tests use:
    - In-memory MongoDB
    - LocalStack for AWS services
    - Separate Kafka topic for testing

## Debugging Failed Tests

=== "Logs"
    ```bash
    docker compose logs -f
    ```

=== "Specific Service"
    ```bash
    docker compose logs catalog-service
    ```

!!! tip "Cleanup"
    After running integration tests:
    ```bash
    docker compose down -v
    ```
