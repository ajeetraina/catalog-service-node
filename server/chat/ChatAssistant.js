// ChatAssistant.js - Handles conversational interactions with catalog data

const { Anthropic } = require('@anthropic-ai/sdk');
const MCPConnection = require('./MCPConnection');

class ChatAssistant {
  constructor(config = {}) {
    this.anthropic = new Anthropic({
      apiKey: config.claudeApiKey || process.env.CLAUDE_API_KEY
    });

    this.mcpConnection = new MCPConnection({
      baseUrl: config.mcpBaseUrl || process.env.MCP_BASE_URL || 'http://localhost:8040'
    });
    
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.conversationHistory = [];
    this.dbSchema = null;
  }

  // Initialize the assistant with catalog schema info
  async initialize() {
    try {
      // Get database schema to provide context to the assistant
      const schema = await this.mcpConnection.getSchema();
      this.dbSchema = schema;
      this.databaseContext = JSON.stringify(schema, null, 2);
      console.log('Chat Assistant initialized with database schema');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chat Assistant:', error);
      return false;
    }
  }

  // Process user input and respond
  async processMessage(userInput) {
    try {
      // Add user message to history
      this.conversationHistory.push({ 
        role: 'user', 
        content: userInput 
      });

      // Prepare system prompt with database context
      const systemPrompt = `
You are a helpful assistant for a product catalog application that uses Postgres MCP Server. You can help users query the catalog database.

The catalog database has the following schema:
${this.databaseContext}

When users want to query data:
1. Extract what they're looking for
2. Formulate a SQL query to retrieve that information
3. Write the SQL query between triple backticks like: \`\`\`sql SELECT * FROM table \`\`\`
4. After showing the SQL, execute it and present the results in a user-friendly format

Always respond in a helpful, conversational manner. If you receive error messages from a query, suggest how to fix them.
`;

      // Get response from Claude
      const response = await this.anthropic.messages.create({
        model: this.model,
        system: systemPrompt,
        messages: this.conversationHistory,
        max_tokens: 1024
      });

      // Parse the response to check if there are any SQL queries to execute
      const assistantMessage = response.content[0].text;
      
      // Extract SQL query if present
      const sqlQuery = this.extractSqlQuery(assistantMessage);
      let queryResult = null;
      
      if (sqlQuery) {
        try {
          queryResult = await this.mcpConnection.executeQuery(sqlQuery);
          
          // Add the query result to conversation
          const resultMessage = {
            role: 'assistant',
            content: assistantMessage + `\n\nQuery result: ${JSON.stringify(queryResult, null, 2)}`
          };
          
          this.conversationHistory.push(resultMessage);
          
          return {
            message: assistantMessage,
            sqlQuery: sqlQuery,
            result: queryResult
          };
        } catch (error) {
          // If query execution fails, add error to conversation
          const errorMessage = {
            role: 'assistant',
            content: assistantMessage + `\n\nQuery error: ${error.message}`
          };
          
          this.conversationHistory.push(errorMessage);
          
          return {
            message: assistantMessage,
            sqlQuery: sqlQuery,
            error: error.message
          };
        }
      } else {
        // No SQL query to execute
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage
        });
        
        return {
          message: assistantMessage
        };
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: "I'm sorry, I encountered an error processing your request. Please try again.",
        error: error.message
      };
    }
  }

  // Extract SQL query from assistant response
  extractSqlQuery(message) {
    const sqlPattern = /```sql\s*([\s\S]*?)\s*```/i;
    const match = message.match(sqlPattern);

    if (match && match[1]) {
      return match[1].trim();
    }
    
    return null;
  }

  // Get the conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Clear the conversation history
  clearConversationHistory() {
    this.conversationHistory = [];
    return true;
  }
}

module.exports = ChatAssistant;