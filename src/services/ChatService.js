const MCPService = require('./MCPService');
const ProductService = require('./ProductService');

class ChatService {
  constructor() {
    this.conversations = new Map();
    this.initialized = false;
  }
  
  async initialize() {
    try {
      await MCPService.initialize();
      this.initialized = true;
      console.log('Chat Service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chat Service:', error);
      return false;
    }
  }
  
  async getOrCreateConversation(userId) {
    if (!this.conversations.has(userId)) {
      const conversationId = await MCPService.createConversation();
      this.conversations.set(userId, conversationId);
      
      // Initialize product catalog context
      const products = await ProductService.getProducts();
      await MCPService.updateContext(conversationId, 'productCatalog', products);
    }
    
    return this.conversations.get(userId);
  }
  
  async processMessage(userId, message, isSystemAction = false) {
    try {
      const conversationId = await this.getOrCreateConversation(userId);
      
      if (!isSystemAction) {
        // Add user message to conversation
        await MCPService.addMessage(conversationId, message);
      }
      
      // Process message with Claude
      const response = await MCPService.sendToClaude(conversationId, message);
      
      // Check if there's an action to perform
      let productAction = null;
      if (response.action) {
        productAction = await this.handleProductAction(conversationId, response.action);
      } else {
        // Check if the message indicates a product action using NLP
        const possibleAction = await this.detectProductAction(message);
        if (possibleAction) {
          productAction = possibleAction;
        }
      }
      
      return {
        message: response.message,
        productAction
      };
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: "I'm sorry, I encountered an error while processing your request. Please try again.",
        error: error.message
      };
    }
  }
  
  async handleProductAction(conversationId, action) {
    try {
      if (action.type === 'add_product') {
        const product = action.product;
        
        // Add validation here if needed
        if (!product.name || !product.price) {
          return {
            type: 'error',
            message: 'Product must have at least a name and price'
          };
        }
        
        // Return the proposed product for confirmation
        return {
          type: 'add',
          product
        };
      } else if (action.type === 'delete_product') {
        const productId = action.productId;
        const product = await ProductService.getProductById(productId);
        
        if (!product) {
          return {
            type: 'error',
            message: `No product found with ID ${productId}`
          };
        }
        
        // Return the product for confirmation
        return {
          type: 'delete',
          product
        };
      } else if (action.type === 'list_products') {
        // Update product catalog context
        const products = await ProductService.getProducts();
        await MCPService.updateContext(conversationId, 'productCatalog', products);
        
        return null; // No immediate action needed, just updating context
      }
    } catch (error) {
      console.error('Error handling product action:', error);
      return {
        type: 'error',
        message: error.message
      };
    }
  }
  
  async detectProductAction(message) {
    // Simple keyword-based detection
    const lowerMessage = message.toLowerCase();
    
    if (/add (a )?new product|create (a )?product/i.test(lowerMessage)) {
      // Extract product details from the message
      const name = this.extractField(message, 'name', '');
      const priceMatch = message.match(/price[: ]?\s*\$?(\d+\.?\d*)/i);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      const description = this.extractField(message, 'description', '');
      const category = this.extractField(message, 'category', '');
      
      if (name) {
        return {
          type: 'add',
          product: {
            name,
            price,
            description,
            category
          }
        };
      }
    } else if (/delete product|remove product/i.test(lowerMessage)) {
      // Try to find a product ID in the message
      const idMatch = message.match(/id[: ]?\s*(\d+)/i) || message.match(/product\s*#?(\d+)/i);
      
      if (idMatch) {
        const productId = idMatch[1];
        const product = await ProductService.getProductById(productId);
        
        if (product) {
          return {
            type: 'delete',
            product
          };
        }
      }
      
      // If no ID found, try to find by name
      const productName = this.extractField(message, 'name', '');
      if (productName) {
        const products = await ProductService.getProducts();
        const product = products.find(p => 
          p.name.toLowerCase() === productName.toLowerCase()
        );
        
        if (product) {
          return {
            type: 'delete',
            product
          };
        }
      }
    }
    
    return null;
  }
  
  extractField(message, fieldName, defaultValue) {
    const regex = new RegExp(`${fieldName}[: ]?\\s*["']?([^"',]+)["']?`, 'i');
    const match = message.match(regex);
    return match ? match[1].trim() : defaultValue;
  }
  
  async executeAction(userId, action) {
    const conversationId = await this.getOrCreateConversation(userId);
    
    try {
      if (action.type === 'add') {
        // Create the product
        const newProduct = await ProductService.createProduct(action.product);
        
        // Update product catalog in context
        const products = await ProductService.getProducts();
        await MCPService.updateContext(conversationId, 'productCatalog', products);
        
        return {
          success: true,
          message: `Product "${newProduct.name}" added successfully!`,
          type: 'add'
        };
      } else if (action.type === 'delete') {
        // Delete the product
        await ProductService.deleteProduct(action.productId);
        
        // Update product catalog in context
        const products = await ProductService.getProducts();
        await MCPService.updateContext(conversationId, 'productCatalog', products);
        
        return {
          success: true,
          message: `Product deleted successfully.`,
          type: 'delete'
        };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return {
        success: false,
        message: `Failed to ${action.type} product: ${error.message}`,
        type: action.type
      };
    }
  }
  
  async teardown() {
    await MCPService.teardown();
    console.log('Chat Service shutdown complete');
  }
}

module.exports = new ChatService();
