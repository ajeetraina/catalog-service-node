// MCPConnection.js - Handles the connection to Postgres MCP Server

const axios = require('axios');

class MCPConnection {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:8040'; // Default MCP Server port
    this.client = axios.create({
      baseUrl: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async executeQuery(query) {
    try {
      const response = await this.client.post('/tools/postgres/query', {
        query: query
      });
      return response.data;
    } catch (error) {
      console.error('Error executing query via MCP:', error);
      throw error;
    }
  }

  async getSchema() {
    try {
      const response = await this.client.get('/tools/postgres/schema');
      return response.data;
    } catch (error) {
      console.error('Error getting schema via MCP:', error);
      throw error;
    }
  }
}

module.exports = MCPConnection;