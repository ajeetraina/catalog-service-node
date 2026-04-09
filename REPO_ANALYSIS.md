# Repository Analysis: `catalog-service-node`

## 1) High-level architecture

This repository implements a **catalog API service** (Node.js + Express) with a demo React frontend and local dependency stack orchestrated via Docker Compose.

Core runtime architecture:

- **API layer**: Express server in `src/index.js` exposing product and image endpoints.
- **Catalog persistence**: PostgreSQL `products` table (schema in `dev/db/1-create-schema.sql`).
- **Image storage**: S3-compatible object storage (LocalStack in dev, AWS S3 in real deployments) via AWS SDK.
- **Inventory enrichment**: External inventory HTTP service queried on-demand.
- **Event publishing**: Kafka producer emits product lifecycle events (e.g., `product_created`, `image_uploaded`).
- **Demo UI**: React + Vite app under `dev/webapp` calling `/api/*` endpoints.

Compose (`compose.yaml`) provides all dependencies for local development:

- `postgres`, `aws` (LocalStack), `mock-inventory` (WireMock), `kafka`, `kafka-ui`, `pgadmin`, and `demo-client`.

## 2) Frontend components

Frontend is intentionally lightweight and lives in `dev/webapp/src`.

### `App.jsx`

Responsibilities:

- Holds top-level state: `catalog`, `errorOccurred`.
- Fetches catalog from `GET /api/products`.
- Creates products via `POST /api/products` with generated/sample values.
- Renders table headers and a row per product using `ProductRow`.
- Shows loading and basic error fallback text.

Behavioral notes:

- No routing/state management library; single-page demo UI.
- No pagination/infinite scroll; renders entire catalog array.
- Error handling is coarse-grained (`fetch` catch only, no status-specific UX).

### `ProductRow.jsx`

Responsibilities per product row:

- Lazy fetches inventory details from `GET /api/products/:id` (reads `inventory` field).
- Uploads demo image via multipart `POST /api/products/:id/image`.
- Displays image from `GET /api/products/:id/image` when `has_image` is true.

Behavioral notes:

- Inventory is fetched on button click, not preloaded.
- Upload uses bundled static image (`product-image.png`).
- `onChange` callback refreshes catalog after inventory/image actions.

### `main.jsx`

- Standard React bootstrap using `createRoot` and `StrictMode`.

### Frontend infrastructure

- `vite.config.js` proxies `/api` to `http://host.docker.internal:3000`, enabling UI-in-container -> API-on-host flow.
- `dev/webapp/package.json` runs Vite dev server and installs dependencies at startup (`yarn install && vite --host 0.0.0.0`).

## 3) Backend logic

### API entrypoint (`src/index.js`)

Express endpoints:

- `GET /` health-like hello response.
- `GET /api/products` -> list products.
- `POST /api/products` -> create product; returns `201` and `Location` header.
- `GET /api/products/:id` -> product + inventory enrichment.
- `GET /api/products/:id/image` -> streams PNG from object storage.
- `POST /api/products/:id/image` -> uploads multipart file to storage and marks product image flag.

Cross-cutting behaviors:

- Uses `multer` temp-file upload (`os.tmpdir()`).
- Reads uploaded file from disk with `fs.readFileSync` then delegates to service.
- Graceful shutdown handlers on `SIGINT`/`SIGTERM` call service teardowns.

Observations:

- Minimal input validation at HTTP boundary.
- Error handling is inconsistent (create route wraps in try/catch; others rely on implicit rejection behavior).
- TODO/FIXME comments acknowledge missing rate limiting, health checks, and error sanitization.

### Service layer

#### `ProductService.js`

Main domain orchestrator:

- Lazily creates/shared `pg.Client` from environment variables.
- `getProducts()` returns DB rows ordered by ID.
- `createProduct(product)`:
  - checks UPC uniqueness with DB query,
  - inserts product,
  - publishes Kafka event `product_created`.
- `getProductById(id)`:
  - fetches product record,
  - enriches response with inventory from `InventoryService`.
- `getProductImage(id)` delegates to storage read.
- `uploadProductImage(id, buffer)` stores image and sets `has_image=TRUE` in DB.

Important coupling:

- Product creation and image upload both emit events (directly or via StorageService).
- Inventory is not persisted in catalog DB; it is computed per request from external service.

#### `InventoryService.js`

- Uses `node-fetch` against `INVENTORY_SERVICE_BASE_URL/api/inventory?upc=...`.
- Maps responses into normalized shape:
  - `{ error: false, quantity }` on 200
  - `{ error: true, message }` for not found/non-200/fetch failures.

This keeps the API resilient to inventory service outages by returning structured error payloads instead of throwing.

#### `StorageService.js`

- Uses AWS SDK v3 S3 client.
- Fixed object key pattern: `${productId}/product.png`.
- `uploadFile(...)` uploads binary and publishes `image_uploaded` event.
- `getFile(...)` returns stream body for API response piping.

#### `PublisherService.js`

- Lazily instantiates Kafka producer (`kafkajs`) with env-configured brokers.
- `publishEvent(topic, event)` serializes JSON payload.
- Publish failures are logged but swallowed.

## 4) Product catalog logic (domain behavior)

### Data model

`products` table (`dev/db/1-create-schema.sql`):

- `id` (PK, serial)
- `name` (required)
- `description` (optional)
- `upc` (required, unique)
- `price` (required decimal)
- `has_image` (required boolean, default false)

### Core domain flows

1. Product creation

- API receives product payload.
- Service enforces UPC uniqueness (app-level + DB unique constraint).
- Product inserted into PostgreSQL.
- Kafka event published (`product_created`).

2. Product retrieval

- Base product loaded from DB.
- Inventory fetched from external service by UPC.
- Combined response returned (`{ ...product, inventory }`).

3. Product image lifecycle

- UI/API upload stores image in S3 bucket under product path.
- DB `has_image` flag updated to true.
- Kafka `image_uploaded` event emitted.
- Image retrieval streams from object storage.

### Domain strengths

- Clear separation between persistence (Postgres), media (S3), and derived availability (inventory service).
- Event emission allows eventual downstream integrations.

### Domain gaps / risks currently visible

- Validation gaps (price range, required fields beyond DB constraints, schema validation).
- No pagination/filtering/search in product listing.
- No explicit transaction boundaries across DB + event publish + storage updates.
- Inventory is request-time only and may add latency/failure variability.
- Deletion/update flows are not present.

## 5) Testing infrastructure

Testing strategy uses Jest with clear split between unit and integration tests.

### Tooling and commands

From root `package.json`:

- `npm test`: all tests (`env-cmd --file .env.node -- jest --detectOpenHandles`)
- `npm run unit-test`: excludes integration spec paths
- `npm run integration-test`: runs integration specs only

`.env.node` includes:

- `DEBUG=testcontainers*`
- `NODE_OPTIONS=--dns-result-order=ipv4first`

### Unit tests

`test/services/InventoryService.spec.js`

- Mocks `node-fetch`.
- Verifies behavior for 404, non-200 error payload, thrown fetch error, and success case.
- Focus is deterministic response mapping logic for inventory client.

### Integration tests (Testcontainers)

`test/integration/productCreation.integration.spec.js` with helpers:

- `containerSupport.js` starts:
  - PostgreSQL container with schema bootstrap SQL copied into init dir.
  - Kafka container with topic creation command.
  - LocalStack container with S3 bucket creation.
- Dynamically wires runtime env vars (`PG*`, `KAFKA_BOOTSTRAP_SERVERS`, AWS settings).
- Tests:
  - product creation and retrieval
  - Kafka event publication on create
  - image upload + retrieval + image event publication
  - duplicate UPC rejection

`kafkaSupport.js` provides a test consumer utility with polling wait helper for message assertions.

### E2E / demo testing assets

Under `test/e2e` there are shell scripts and guided scenario runners intended for browser-testing demos. These appear to be **demo scaffolding** rather than CI-grade automated Playwright tests in this repository state.

## 6) Overall architecture assessment

The application follows a straightforward layered architecture:

- **Presentation/API** (`src/index.js`)
- **Domain/Application services** (`src/services/*.js`)
- **External adapters** (Postgres, S3, HTTP inventory, Kafka)
- **Demo frontend** (`dev/webapp`)
- **Test pyramid subset** (unit + integration, with demo-oriented E2E scripts)

For a demo/training project, the boundaries are clear and representative of a real catalog system with event-driven integrations. The most prominent production-readiness gaps are around validation, resilience/retries, transactional consistency, and API operability concerns (health checks/rate limiting/error hygiene).
