# Multi-stage Dockerfile for catalog service
FROM node:22-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/app

# Copy package files
COPY package*.json ./

# Install production dependencies (using --omit=dev instead of deprecated --only=production)
RUN npm i --omit=dev --ignore-scripts && npm cache clean --force

# Development stage
FROM node:22-slim AS development

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/app

# Copy package files
COPY package*.json ./

# Install all dependencies for development
RUN npm i && npm cache clean --force

# Copy application code
COPY . .

# Expose ports
EXPOSE 3001 9090

# Start in development mode
CMD ["npm", "run", "dev"]

# Backend production stage
FROM base AS backend

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /usr/local/app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Expose ports
EXPOSE 3001 9090

# Start the application
CMD ["npm", "start"]
