// chatRoutes.js - Express routes for the chat assistant

const express = require('express');
const router = express.Router();
const ChatAssistant = require('./ChatAssistant');

// Create a singleton instance of the ChatAssistant
const chatAssistant = new ChatAssistant({
  claudeApiKey: process.env.CLAUDE_API_KEY,
  mcpBaseUrl: process.env.MCP_BASE_URL || 'http://localhost:8040'
});

// Initialize the chat assistant when the server starts
(async () => {
  try {
    await chatAssistant.initialize();
    console.log('Chat Assistant initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Chat Assistant:', error);
  }
})();

// POST route to send a message to the chat assistant
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await chatAssistant.processMessage(message);
    res.json(response);
  } catch (error) {
    console.error('Error in chat message route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route to retrieve conversation history
router.get('/history', (req, res) => {
  try {
    const history = chatAssistant.getConversationHistory();
    res.json({ history });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route to clear conversation history
router.post('/clear', (req, res) => {
  try {
    chatAssistant.clearConversationHistory();
    res.json({ success: true, message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;