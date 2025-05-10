const express = require('express');
const router = express.Router();
const { processChatbotMessage } = require('../services/ChatbotService');

/**
 * Chatbot API endpoint to process messages and provide AI-assisted responses
 */
router.post('/', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Process the message using the AI chatbot service
    const response = await processChatbotMessage(message, context);
    
    return res.json(response);
  } catch (error) {
    console.error('Error processing chatbot message:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;