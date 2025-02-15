# Security Scanning with Docker Scout

## Running a Security Scan

```bash
docker scout cves catalog-service
```

!!! warning "Authentication"
    Ensure you're logged in to Docker Hub:
    ```bash
    docker login
    ```

## Understanding the Results

=== "Vulnerabilities"
    ```bash
    docker scout quickview catalog-service
    ```

=== "Detailed Report"
    ```bash
    docker scout report catalog-service
    ```

## Base Image Analysis

```bash
docker scout compare catalog-service:latest catalog-service:previous
```

## Recommendations

!!! tip "Best Practices"
    1. Use official base images
    2. Keep base images updated
    3. Implement multi-stage builds
    4. Remove unnecessary packages

## Continuous Monitoring

Enable continuous monitoring in Docker Hub:

1. Go to Docker Hub repository
2. Enable Scout monitoring
3. Set up notifications
