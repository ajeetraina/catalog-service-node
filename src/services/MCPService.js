const { Pool } = require('pg');
const fetch = require('node-fetch');

class MCPService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.MCP_POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/mcp',
    });
    
    this.claudeDesktopUrl = process.env.CLAUDE_DESKTOP_URL || 'http://localhost:3001/api/chat';
    
    this.systemPrompt = `
      You are a helpful assistant for managing a product catalog. You can:
      1. List products
      2. Find products by name, category, or price range 
      3. Add new products to the catalog
      4. Delete products from the catalog
      
      When adding a product, ask for the name, price, description, and category.
      When deleting a product, ask for confirmation before proceeding.
      
      Always respond in a helpful, concise manner.
    `;
    
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle MCP Postgres client', err);
      process.exit(-1);
    });
  }
  
  async initialize() {
    try {
      // Check connection to MCP Postgres
      const client = await this.pool.connect();
      console.log('Connected to MCP Postgres database');
      client.release();
      
      // Create required tables if they don't exist
      await this.createTables();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP service:', error);
      return false;
    }
  }
  
  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_conversations (
          id SERIAL PRIMARY KEY,
          conversation_id TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_messages (
          id SERIAL PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES mcp_conversations(conversation_id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          role TEXT NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS mcp_context (
          id SERIAL PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES mcp_conversations(conversation_id) ON DELETE CASCADE,
          context_key TEXT NOT NULL,
          context_value JSONB NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(conversation_id, context_key)
        )
      `);
      
      console.log('MCP tables created or already exist');
    } catch (error) {
      console.error('Error creating MCP tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async createConversation() {
    const client = await this.pool.connect();
    try {
      // Generate a UUID for the conversation
      const { rows } = await client.query(`
        INSERT INTO mcp_conversations (conversation_id) 
        VALUES (gen_random_uuid()::text) 
        RETURNING conversation_id
      `);
      
      const conversationId = rows[0].conversation_id;
      
      // Add system message to start the conversation
      await client.query(`
        INSERT INTO mcp_messages (conversation_id, content, role)
        VALUES ($1, $2, 'system')
      `, [conversationId, this.systemPrompt]);
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async addMessage(conversationId, content, role = 'user') {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO mcp_messages (conversation_id, content, role)
        VALUES ($1, $2, $3)
      `, [conversationId, content, role]);
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getConversation(conversationId) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT role, content FROM mcp_messages 
        WHERE conversation_id = $1
        ORDER BY timestamp ASC
      `, [conversationId]);
      
      return rows;
    } catch (error) {
      console.error('Error retrieving conversation:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async updateContext(conversationId, key, value) {
    const client = await this.pool.connect();
    try {
      // Upsert the context value
      await client.query(`
        INSERT INTO mcp_context (conversation_id, context_key, context_value)
        VALUES ($1, $2, $3)
        ON CONFLICT (conversation_id, context_key) 
        DO UPDATE SET context_value = $3, timestamp = CURRENT_TIMESTAMP
      `, [conversationId, key, JSON.stringify(value)]);
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getContext(conversationId, key) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT context_value FROM mcp_context
        WHERE conversation_id = $1 AND context_key = $2
      `, [conversationId, key]);
      
      return rows.length > 0 ? rows[0].context_value : null;
    } catch (error) {
      console.error('Error retrieving context:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getAllContext(conversationId) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT context_key, context_value FROM mcp_context
        WHERE conversation_id = $1
      `, [conversationId]);
      
      const context = {};
      rows.forEach(row => {
        context[row.context_key] = row.context_value;
      });
      
      return context;
    } catch (error) {
      console.error('Error retrieving all context:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  async sendToClaude(conversationId, userMessage) {
    try {
      // Get the conversation history
      const messages = await this.getConversation(conversationId);
      
      // Get the context
      const context = await this.getAllContext(conversationId);
      
      // Format messages for Claude Desktop
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add user's current message
      formattedMessages.push({
        role: 'user',
        content: userMessage
      });
      
      // Add context to request
      const payload = {
        messages: formattedMessages,
        context: {
          productCatalog: context.productCatalog || [],
          currentAction: context.currentAction || null
        }
      };
      
      // Send request to Claude Desktop
      const response = await fetch(this.claudeDesktopUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Claude Desktop returned ${response.status}: ${await response.text()}`);
      }
      
      const claudeResponse = await response.json();
      
      // Save the assistant's response to the conversation
      await this.addMessage(conversationId, claudeResponse.content, 'assistant');
      
      // Check if the response includes any tool calls or context updates
      if (claudeResponse.contextUpdates) {
        for (const [key, value] of Object.entries(claudeResponse.contextUpdates)) {
          await this.updateContext(conversationId, key, value);
        }
      }
      
      return {
        message: claudeResponse.content,
        action: claudeResponse.action || null
      };
    } catch (error) {
      console.error('Error sending message to Claude:', error);
      throw error;
    }
  }
  
  async teardown() {
    await this.pool.end();
    console.log('MCP Service connections closed');
  }
}

module.exports = new MCPService();
