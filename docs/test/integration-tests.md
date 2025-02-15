# Integration Testing with Testcontainers

## What is Testcontainers?

!!! info "About Testcontainers"
    Testcontainers is a library that supports testing by providing lightweight, throwaway instances of common databases, message brokers, and other services in Docker containers.

## Running Integration Tests

```bash
npm run test:integration
```

!!! note "Automatic Container Management"
    Testcontainers automatically handles:
    - Starting required containers
    - Port allocation
    - Container cleanup

## Test Structure

```
tests/
├── setup/
│   └── testcontainers.js    # Container configuration
├── integration/
│   ├── api/               # API tests
│   ├── kafka/             # Kafka integration tests
│   └── aws/               # LocalStack integration tests
└── __fixtures__/
```

## Example: Kafka Integration Test

=== "Test Setup"
    ```javascript
    beforeAll(async () => {
      containers = await TestContainers.startKafka();
      kafka = new Kafka({
        brokers: [process.env.KAFKA_BROKERS]
      });
    });
    ```

=== "Test Case"
    ```javascript
    it('should publish message', async () => {
      await producer.send('topic', message);
      // Assert message received
    });
    ```

## Example: LocalStack Test

=== "Test Setup"
    ```javascript
    beforeAll(async () => {
      container = await TestContainers.startLocalStack();
      s3 = new AWS.S3({
        endpoint: process.env.AWS_ENDPOINT
      });
    });
    ```

=== "Test Case"
    ```javascript
    it('should store in S3', async () => {
      await s3.putObject(params).promise();
      // Assert object stored
    });
    ```

## Debugging Failed Tests

!!! tip "Container Logs"
    Testcontainers provides access to container logs:
    ```javascript
    console.log(await container.logs());
    ```

## Best Practices

1. **Resource Cleanup**
   ```javascript
   afterAll(async () => {
     await container.stop();
   });
   ```

2. **Wait for Services**
   ```javascript
   await container.waitForMessageOnStdout('Started');
   ```

3. **Isolated Networks**
   ```javascript
   await container.withNetwork(network);
   ```

## Common Issues

!!! warning "Troubleshooting"
    - Ensure Docker is running
    - Check port conflicts
    - Verify container network access
    - Check resource limits

## Performance Tips

1. **Reuse Containers**
   ```javascript
   // In global setup
   container = await TestContainers.startAll();
   ```

2. **Parallel Testing**
   ```bash
   npm run test:integration -- --maxConcurrency=3
   ```

3. **Resource Optimization**
   ```javascript
   container.withMemoryLimit('256m');
   ```