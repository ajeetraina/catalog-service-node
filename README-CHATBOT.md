# Product Catalog with AI Chatbot

This branch demonstrates how to integrate a chatbot powered by **Docker Model Runner** (running on the host) and **Llama 3.2** into your product catalog application.

## 🤖 Features

- **AI-Powered Chatbot**: Chat with an AI assistant about your product catalog
- **Docker Model Runner**: Uses Docker Model Runner running on the host machine with Llama 3.2
- **Real-time Product Context**: The chatbot has access to your current product inventory
- **Floating Chat Interface**: Unobtrusive chat widget that doesn't interfere with the main catalog
- **Monitoring Stack**: Includes Grafana, Prometheus, and Jaeger for observability

## 🚀 Prerequisites

**IMPORTANT**: This implementation requires Docker Model Runner to be running on your host machine.

### 1. Install Docker Model Runner
Follow the instructions at: https://docs.docker.com/model-runner/

### 2. Start Docker Model Runner
```bash
# Start Docker Model Runner with the required model
docker run -d --name model-runner \
  -p 12434:12434 \
  -v ~/.docker/models:/models \
  docker/model-runner:latest
```

### 3. Download the Model
```bash
# Download Llama 3.2 model
docker exec model-runner /app/download-model ai/llama3.2:1B-Q8_0
```

## 🚀 Quick Start

1. **Ensure Docker Model Runner is running**:
   ```bash
   curl http://localhost:12434/health
   ```

2. **Clone and start the catalog services**:
   ```bash
   git checkout model-runner-chatbot
   docker compose up -d
   ```

3. **Wait for services to start**:
   ```bash
   docker compose logs catalog-api -f
   ```
   Wait until you see "Catalog Service is running on port 3001"

4. **Access the application**:
   - **Product Catalog with Chatbot**: http://localhost:5173
   - **Grafana Dashboard**: http://localhost:3000 (admin/admin)
   - **Prometheus**: http://localhost:9091
   - **Jaeger Tracing**: http://localhost:16686

5. **Test the chatbot**:
   - Click the blue chat bubble in the bottom-right corner
   - Try these example questions:
     - "What products do you have?"
     - "Tell me about the most expensive item"
     - "Can you recommend something under $150?"
     - "How many products are in the catalog?"

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Catalog API   │    │ Docker Model    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Runner        │
│   Port: 5173    │    │   Port: 3001    │    │   (Host: 12434) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Monitoring    │    │   Llama 3.2     │
│   Port: 5432    │    │   Grafana: 3000 │    │   Model         │
│                 │    │   Prometheus:   │    │                 │
│                 │    │   9091          │    │                 │
└─────────────────┘    │   Jaeger: 16686 │    └─────────────────┘
                       └─────────────────┘
```

## 🛠️ Services

| Service | Port | Description |
|---------|------|-------------|
| demo-client | 5173 | React frontend with chatbot |
| catalog-api | 3001 | Node.js API with chat endpoint |
| llm | - | Docker Compose model provider (connects to host Model Runner) |
| postgres | 5432 | Product database |
| grafana | 3000 | Monitoring dashboard |
| prometheus | 9091 | Metrics collection |
| jaeger | 16686 | Distributed tracing |
| pgadmin | 5050 | Database administration |
| kafka | 9092 | Message streaming |
| kafka-ui | 8080 | Kafka management interface |

## 💬 Chat API

The chatbot uses the `/api/chat` endpoint that:

1. Receives user messages
2. Fetches current product catalog for context
3. Sends requests to Docker Model Runner (on host)
4. Returns AI-generated responses

### Example Chat Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What products do you have?",
    "conversation_id": "12345"
  }'
```

### Example Response

```json
{
  "response": "We currently have several great products in our catalog! Here are some highlights:\n\n- Smart Bluetooth Speaker: A high-quality wireless speaker with excellent sound (Price: $120)\n- Wireless Charging Pad: Fast wireless charging for your devices (Price: $45)\n- LED Desk Lamp: Adjustable brightness LED lamp perfect for work (Price: $35)\n\nWould you like more details about any of these products or are you looking for something specific?",
  "conversation_id": "12345",
  "timestamp": "2025-09-07T08:30:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

The application uses these key environment variables (defined in `catalog-api.env`):

- `BASE_URL`: Model Runner endpoint (default: http://host.docker.internal:12434/engines/llama.cpp/v1/)
- `MODEL`: Model to use (default: ai/llama3.2:1B-Q8_0)
- `API_KEY`: API key for model service (default: dockermodelrunner)

### Model Configuration

The Llama 3.2 model is configured in the root `.env` file:

```bash
LLM_MODEL_NAME=ai/llama3.2:1B-Q8_0
API_KEY=dockermodelrunner
```

## 📊 Monitoring

Access Grafana at http://localhost:3000 (admin/admin) to monitor:

- API request metrics
- Model response times
- Database connections
- System resources

Access Jaeger at http://localhost:16686 for distributed tracing.

## 🔍 Troubleshooting

### Chatbot not responding
1. **Check if Model Runner is running on host**:
   ```bash
   curl http://localhost:12434/health
   ```

2. **Verify model is loaded**:
   ```bash
   curl http://localhost:12434/v1/models
   ```

3. **Check catalog-api logs**:
   ```bash
   docker compose logs catalog-api
   ```

### Model Runner connection issues
1. **Verify host.docker.internal resolves**:
   ```bash
   docker compose exec catalog-api ping host.docker.internal
   ```

2. **Check if port 12434 is accessible**:
   ```bash
   docker compose exec catalog-api wget -qO- http://host.docker.internal:12434/health
   ```

### Frontend not connecting to backend
1. **Verify the backend is running**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check CORS settings** in the backend code

## 🚀 Development

To develop locally:

1. **Backend changes**: The API code is volume-mounted for the dev client
2. **Frontend changes**: Vite provides hot reloading
3. **Model updates**: Modify the `LLM_MODEL_NAME` in `.env`

## 🎯 Key Differences from Previous Implementation

- ✅ **Model Runner runs on host** (not as container)
- ✅ **Uses `provider.type: model`** in compose.yaml
- ✅ **Connects via host.docker.internal:12434**
- ✅ **Proper environment configuration** in catalog-api.env
- ✅ **Health checks and observability** included
- ✅ **Follows working example pattern** from genai-model-runner-metrics

## 📝 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
