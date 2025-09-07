# Product Catalog with AI Chatbot

This branch demonstrates how to integrate a chatbot powered by Docker Model Runner and Llama 3.2 into your product catalog application.

## 🤖 Features

- **AI-Powered Chatbot**: Chat with an AI assistant about your product catalog
- **Docker Model Runner**: Uses Docker Model Runner with Llama 3.2 for local AI inference
- **Real-time Product Context**: The chatbot has access to your current product inventory
- **Floating Chat Interface**: Unobtrusive chat widget that doesn't interfere with the main catalog
- **Monitoring Stack**: Includes Grafana and Prometheus for monitoring the application

## 🚀 Quick Start

1. **Start the services**:
   ```bash
   docker compose up -d
   ```

2. **Wait for services to start**:
   The first time you run this, Docker Model Runner will need to download the Llama 3.2 model, which may take a few minutes.

3. **Access the application**:
   - **Product Catalog**: http://localhost:5173
   - **Grafana Dashboard**: http://localhost:3000 (admin/admin)
   - **Prometheus**: http://localhost:9090
   - **Model Runner**: http://localhost:8081

4. **Try the chatbot**:
   - Click the blue chat bubble in the bottom-right corner
   - Ask questions like:
     - "What products do you have?"
     - "Tell me about the most expensive item"
     - "Can you recommend something under $150?"
     - "How many products are in the catalog?"

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ Docker Model    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Runner        │
│   Port: 5173    │    │   Port: 3001    │    │   Port: 8081    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Monitoring    │    │   Llama 3.2     │
│   Port: 5432    │    │   Grafana: 3000 │    │   Model         │
└─────────────────┘    │   Prometheus:   │    └─────────────────┘
                       │   9090          │
                       └─────────────────┘
```

## 🛠️ Services

| Service | Port | Description |
|---------|------|-------------|
| demo-client | 5173 | React frontend with chatbot |
| catalog-api | 3001 | Node.js API with chat endpoint |
| model-runner | 8081 | Docker Model Runner with Llama 3.2 |
| postgres | 5432 | Product database |
| grafana | 3000 | Monitoring dashboard |
| prometheus | 9090 | Metrics collection |
| pgadmin | 5050 | Database administration |
| kafka | 9092 | Message streaming |
| kafka-ui | 8080 | Kafka management interface |

## 💬 Chat API

The chatbot is powered by a new `/api/chat` endpoint that:

1. Receives user messages
2. Fetches current product catalog for context
3. Sends requests to Docker Model Runner
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

The application supports these environment variables:

- `MODEL_RUNNER_URL`: URL of the Docker Model Runner (default: http://model-runner:8080)
- `MODEL_RUNNER_MODEL`: Model to use (default: ai/llama3.2:latest)
- `VITE_API_BASE_URL`: Frontend API base URL (default: http://localhost:3001)

### Model Configuration

The Llama 3.2 model is configured in the `compose.yaml` file:

```yaml
models:
  llama_model:
    model: ai/llama3.2:latest
    context_size: 131072
```

## 📊 Monitoring

Access Grafana at http://localhost:3000 (admin/admin) to monitor:

- API request metrics
- Model Runner performance
- Database connections
- System resources

## 🔍 Troubleshooting

### Chatbot not responding
1. Check if Model Runner is healthy: `curl http://localhost:8081/health`
2. Check logs: `docker compose logs model-runner`
3. Verify the model is downloaded: `docker compose logs model-runner | grep "model loaded"`

### Frontend not connecting to backend
1. Verify the backend is running: `curl http://localhost:3001/health`
2. Check the VITE_API_BASE_URL environment variable
3. Check CORS settings in the backend

### Model Runner issues
1. Check available disk space (models can be several GB)
2. Increase Docker memory allocation if needed
3. Check Docker socket permissions

## 🚀 Development

To develop locally:

1. **Backend changes**: The API code is volume-mounted, so changes reflect immediately
2. **Frontend changes**: Vite provides hot reloading
3. **Model updates**: Modify the `models` section in `compose.yaml`

## 🎯 Next Steps

- Add conversation history persistence
- Implement user authentication
- Add product image analysis capabilities
- Create custom prompts for different use cases
- Add support for multiple languages

## 📝 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
