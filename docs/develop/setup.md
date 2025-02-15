# Setting up the Development Environment

!!! note "Prerequisites"
    Before you begin, ensure you have the following installed:
    - Docker Desktop (latest version)
    - Node.js 16 or higher
    - Git
    - Your favorite text editor

## Clone the Repository

```bash
git clone https://github.com/ajeetraina/catalog-service-node-workshop.git
cd catalog-service-node-workshop
```

!!! tip "Using SSH?"
    If you prefer using SSH, use this command instead:
    ```bash
    git clone git@github.com:ajeetraina/catalog-service-node-workshop.git
    ```

## Project Structure

```
.
├── src/               # Application source code
├── tests/             # Test files
├── docker-compose.yml # Services configuration
└── package.json       # Node.js dependencies
```

## Installing Dependencies

=== "npm"
    ```bash
    npm install
    ```

=== "yarn"
    ```bash
    yarn install
    ```

!!! warning "LocalStack Configuration"
    Make sure your Docker Desktop is running before proceeding with the next steps.
    LocalStack will be used to simulate AWS services locally.
