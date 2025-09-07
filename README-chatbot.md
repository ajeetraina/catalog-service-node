# Product Catalog with AI Chatbot

This branch adds an intelligent AI chatbot to the existing product catalog application, powered by Docker Model Runner and Llama 3.2. The chatbot appears directly on the same page as the product catalog and can help users with product queries, recommendations, and catalog management.

## 🚀 Features

- **AI-Powered Chatbot**: Intelligent assistant using Llama 3.2 model via Docker Model Runner
- **Integrated UI**: Chatbot appears on the same page as the product catalog 
- **Real-time Product Context**: AI has access to current product catalog data
- **Monitoring Stack**: Prometheus + Grafana for observability
- **Responsive Design**: Works on desktop and mobile
- **Fallback Support**: Graceful handling when AI services are unavailable

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Chatbot Backend │    │  Model Runner   │
│   (Port 5173)   │◄──►│   (Port 3001)    │◄──►│   (Port 8080)   │
│                 │    │                  │    │                 │
│ - Product Table │    │ - Chat API       │    │ - Llama 3.2     │
│ - Chatbot UI    │    │ - Context Bridge │    │ - Inference     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Monitoring     │
                       │                  │
                       │ - Prometheus     │
                       │   (Port 9091)    │
                       │ - Grafana        │
                       │   (Port 3002)    │
                       └──────────────────┘
```

## 🛠 Setup & Installation

### Prerequisites
- Docker Desktop with Docker Compose
- Node.js 18+ (for local development)
- 4GB+ RAM available for AI model

### Quick Start

1. **Clone and checkout the chatbot branch:**
   ```bash
   git clone https://github.com/ajeetraina/catalog-service-node.git
   cd catalog-service-node
   git checkout chatbot-integration
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for model download (first time only):**
   ```bash
   # Monitor model runner logs
   docker-compose logs -f model-runner
   
   # Wait for "Model loaded successfully" message
   ```

4. **Access the application:**
   - **Product Catalog with Chatbot**: http://localhost:5173
   - **Grafana Dashboard**: http://localhost:3002 (admin/admin)
   - **Prometheus**: http://localhost:9091
   - **PostgreSQL Admin**: http://localhost:5050

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend (Vite) | 5173 | React app with product catalog + chatbot |
| Chatbot Backend | 3001 | Node.js API for chat functionality |
| Model Runner | 8080 | Docker Model Runner with Llama 3.2 |
| Prometheus | 9091 | Metrics collection |
| Grafana | 3002 | Monitoring dashboard |
| PostgreSQL | 5432 | Product database |
| pgAdmin | 5050 | Database admin |

## 🤖 Using the AI Chatbot

### Starting a Chat
1. Open the product catalog at http://localhost:5173
2. Click the **"Ask AI Assistant"** button or the floating chat button
3. The chatbot window will appear on the right side

### Sample Questions to Try
- *"What products do you have in the catalog?"*
- *"Show me products under $150"*
- *"What's the most expensive item?"*
- *"Can you help me add a new product?"*
- *"Tell me about product inventory"*
- *"What categories of products are available?"*

### Chatbot Features
- **Product Awareness**: Knows about current catalog contents
- **Context Memory**: Remembers conversation history
- **Fallback Responses**: Works even when AI is loading
- **Real-time Data**: Always has latest product information
- **Responsive Design**: Adapts to screen size

## 📊 Monitoring & Metrics

### Grafana Dashboard
Access at http://localhost:3002 (admin/admin)

**Key Metrics:**
- Model Runner performance
- Chat response times
- API request rates
- Resource utilization

### Prometheus Metrics
Access at http://localhost:9091

**Available Metrics:**
- `model_runner_requests_total`
- `chatbot_api_requests_total`
- `model_inference_duration_seconds`

## 🧪 Development

### Local Development
```bash
# Start only infrastructure
docker-compose up -d postgres pgadmin kafka model-runner prometheus grafana

# Install frontend dependencies
cd dev/webapp
npm install

# Start frontend dev server
npm run dev

# In another terminal, start chatbot backend
cd ../../chatbot-backend
npm install
npm run dev
```

### Testing the Integration
```bash
# Check all services are healthy
docker-compose ps

# Test chatbot API directly
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what products do you have?"}'

# Check model runner status
curl http://localhost:8080/health
```

## 🔧 Configuration

### Environment Variables

**Frontend (Vite)**:
- `VITE_CHATBOT_API_URL`: Chatbot backend URL (default: http://localhost:3001)

**Chatbot Backend**:
- `MODEL_RUNNER_URL`: Model Runner endpoint (default: http://model-runner:8080)
- `MODEL_NAME`: AI model to use (default: ai/llama3.2:3B-Q8_0)
- `CATALOG_API_URL`: Product catalog API URL

**Model Runner**:
- `ENABLE_GPU`: Enable GPU acceleration (default: false)
- `LOG_LEVEL`: Logging level (default: debug)

### Customizing the AI Model

To use a different Llama model, update `compose.yaml`:

```yaml
models:
  llama_model:
    model: ai/llama3.2:1B-Q8_0  # Smaller, faster model
    # or
    model: ai/llama3.2:8B-Q8_0  # Larger, more capable model
```

## 🚨 Troubleshooting

### Common Issues

**Chatbot not responding:**
```bash
# Check if model runner is healthy
curl http://localhost:8080/health

# Check chatbot backend logs
docker-compose logs chatbot-backend

# Restart model runner if needed
docker-compose restart model-runner
```

**Frontend can't connect to chatbot:**
```bash
# Verify chatbot backend is running
curl http://localhost:3001/health

# Check network connectivity
docker-compose exec demo-client ping chatbot-backend
```

**Model taking too long to load:**
```bash
# Monitor download progress
docker-compose logs -f model-runner

# Check available disk space
docker system df
```

**Performance Issues:**
- Increase Docker memory limit to 6GB+
- Use smaller model variant (1B instead of 3B)
- Enable GPU acceleration if available

### Health Checks
```bash
# All service health check
curl http://localhost:3001/health      # Chatbot backend
curl http://localhost:8080/health      # Model runner
curl http://localhost:9091/-/healthy   # Prometheus
curl http://localhost:3002/api/health  # Grafana
```

## 📝 API Documentation

### Chatbot API Endpoints

**POST /api/chat**
```json
{
  "message": "What products do you have?",
  "conversationHistory": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"}
  ]
}
```

**Response:**
```json
{
  "response": "I can see 5 products in the catalog...",
  "timestamp": "2024-01-15T10:30:00Z",
  "model": "ai/llama3.2:3B-Q8_0"
}
```

**GET /api/catalog-stats**
```json
{
  "totalProducts": 12,
  "averagePrice": 150.25,
  "categories": ["Electronics", "Books"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🌟 What's New in This Branch

- ✅ **Docker Model Runner Integration**: Direct integration with Llama 3.2
- ✅ **Embedded Chatbot UI**: Chat interface on the same page as catalog
- ✅ **Real-time Product Context**: AI knows current catalog state
- ✅ **Enhanced UI/UX**: Modern, responsive design
- ✅ **Monitoring Stack**: Prometheus + Grafana observability
- ✅ **Fallback Handling**: Graceful degradation when AI unavailable
- ✅ **Mobile Responsive**: Works on all device sizes

## 🔗 Related Links

- [Docker Model Runner Documentation](https://docs.docker.com/desktop/model-runner/)
- [Llama 3.2 Model Card](https://ai.meta.com/llama/)
- [Original Catalog Service](https://github.com/ajeetraina/catalog-service-node)
- [AI Enhanced Multi-Agent Version](https://github.com/ajeetraina/catalog-service-ai-enhanced)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch from `chatbot-integration`
3. Make your changes
4. Test with `docker-compose up`
5. Submit a pull request

## 📄 License

Apache 2.0 - see LICENSE file for details.

---

**🎉 Enjoy your AI-enhanced product catalog!** 

If you encounter any issues or have questions, please open an issue on GitHub.
