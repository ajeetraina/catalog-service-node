import { useState, useEffect, useRef } from 'react';

// Chatbot component for product catalog
const ProductChatbot = ({ onProductCreated }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: "Hello! I'm your Product Catalog Assistant. I can help you add new products, upload images, and more. What would you like to do today?",
      suggestions: ['Add a new product', 'View recent products', 'Upload an image']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [chatContext, setChatContext] = useState({
    intent: 'greeting',
    data: null
  });
  const [isOpen, setIsOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Add a bot message to the chat
  const addBotMessage = (content, suggestions = []) => {
    setMessages(prev => [...prev, { 
      role: 'bot', 
      content,
      suggestions
    }]);
  };
  
  // Add a user message to the chat
  const addUserMessage = (content) => {
    setMessages(prev => [...prev, { 
      role: 'user', 
      content 
    }]);
  };
  
  // Process user message by sending to API
  const processMessage = async (message) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          context: chatContext
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process message');
      }
      
      const data = await response.json();
      
      // Update context
      setChatContext({
        intent: data.intent || chatContext.intent,
        data: data.data || chatContext.data
      });
      
      // Add bot response
      addBotMessage(data.text, data.suggestions || []);
      
      // If a product was created, notify parent component
      if (data.intent === 'product_created' && data.data && data.data.id) {
        if (onProductCreated) {
          onProductCreated(data.data);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error processing message:', error);
      addBotMessage(`Sorry, I encountered an error: ${error.message}`, ['Try again']);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = inputMessage;
    addUserMessage(message);
    setInputMessage('');
    
    await processMessage(message);
  };
  
  // Handle clicking a suggestion
  const handleSuggestionClick = async (suggestion) => {
    addUserMessage(suggestion);
    await processMessage(suggestion);
  };
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedImage(file);
    
    // Show selected image in chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: 'Selected image:',
      image: URL.createObjectURL(file)
    }]);
    
    // If we're in the process of uploading an image to a product
    if (chatContext.intent === 'awaiting_image' && chatContext.data && chatContext.data.productId) {
      setIsLoading(true);
      
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`/api/products/${chatContext.data.productId}/image`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        
        addBotMessage(
          `? Image uploaded successfully for product #${chatContext.data.productId}! What would you like to do next?`,
          ['Add another product', 'View all products']
        );
        
        // Reset context
        setChatContext({
          intent: 'image_uploaded',
          data: null
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        addBotMessage(`Sorry, I couldn't upload the image: ${error.message}`, ['Try again']);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Just acknowledge the image upload
      addBotMessage(
        "I've received your image. What would you like to do with it?",
        ["Upload for a product", "Generate a product from this image"]
      );
    }
  };
  
  // Toggle chatbot visibility
  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };
  
  return (
    <div className="chatbot-container">
      {/* Chatbot toggle button */}
      <button 
        className="chatbot-toggle" 
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px',
          zIndex: 1000
        }}
      >
        {isOpen ? '?' : '?'}
      </button>
      
      {/* Chatbot panel */}
      {isOpen && (
        <div 
          className="chatbot-panel"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '350px',
            height: '500px',
            borderRadius: '12px',
            backgroundColor: 'white',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div 
            className="chatbot-header"
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 16px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>Product Catalog Assistant</span>
            <button 
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ?
            </button>
          </div>
          
          {/* Messages container */}
          <div 
            className="chatbot-messages"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((message, index) => (
              <div 
                key={index}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: message.role === 'user' ? '#E3F2FD' : '#F1F1F1',
                  padding: '10px 14px',
                  borderRadius: message.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                }}
              >
                {/* Message content */}
                <div 
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
                
                {/* Uploaded image */}
                {message.image && (
                  <div style={{ marginTop: '8px' }}>
                    <img 
                      src={message.image} 
                      alt="Uploaded" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '200px',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                )}
                
                {/* Suggestions */}
                {message.role === 'bot' && message.suggestions && message.suggestions.length > 0 && (
                  <div 
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}
                  >
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          backgroundColor: '#E8F5E9',
                          color: '#4CAF50',
                          border: '1px solid #4CAF50',
                          borderRadius: '16px',
                          padding: '5px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div 
            className="chatbot-input"
            style={{
              padding: '12px',
              borderTop: '1px solid #E0E0E0',
              display: 'flex',
              gap: '8px'
            }}
          >
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: '#E8F5E9',
                color: '#4CAF50',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              ?
            </button>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            {/* Text input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '18px',
                border: '1px solid #E0E0E0',
                outline: 'none'
              }}
            />
            
            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                opacity: isLoading || !inputMessage.trim() ? 0.5 : 1
              }}
            >
              ?
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductChatbot;