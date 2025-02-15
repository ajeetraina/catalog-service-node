# Running the Services

## Starting the Environment

Use Docker Compose to start all required services:

```bash
docker compose up -d
```

!!! info "Services Started"
    This command will start:
    - Kafka broker
    - Zookeeper
    - LocalStack (AWS services simulator)
    - The catalog service

## Verifying Services

=== "Kafka"
    ```bash
    docker compose logs kafka
    ```

=== "LocalStack"
    ```bash
    docker compose logs localstack
    ```

=== "Catalog Service"
    ```bash
    docker compose logs catalog-service
    ```

## Accessing the Service

The catalog service will be available at:
```
http://localhost:3000
```

!!! tip "API Documentation"
    Access the Swagger documentation at:
    ```
    http://localhost:3000/api-docs
    ```

## Stopping the Services

```bash
docker compose down
```

!!! warning "Data Persistence"
    Using `docker compose down` will remove the containers and networks.
    Add `-v` flag to also remove volumes if you want to start fresh:
    ```bash
    docker compose down -v
    ```
