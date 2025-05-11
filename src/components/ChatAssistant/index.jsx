import React, { useState, useEffect, useRef } from 'react';
import './ChatAssistant.css';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([{
    text: "Hello! I'm your catalog assistant powered by Postgres MCP. You can ask me questions about your product catalog. For example, try asking 'Show me all products' or 'What's the most expensive product?'",
    isBot: true
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to UI
    const userMessage = {
      text: input,
      isBot: false
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to backend
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      // Format the response message
      let responseText = data.message;
      
      // Format SQL if present
      if (data.sqlQuery) {
        responseText = responseText.replace(/```sql[\s\S]*?```/g, '');
        responseText += "\n\n**SQL Query:**\n```sql\n" + data.sqlQuery + "\n```";
      }
      
      // Format results if present
      if (data.result) {
        responseText += "\n\n**Results:**\n```json\n" + JSON.stringify(data.result, null, 2) + "\n```";
      }
      
      // Format error if present
      if (data.error) {
        responseText += "\n\n**Error:**\n```\n" + data.error + "\n```";
      }
      
      // Add bot response to UI
      const botMessage = {
        text: responseText,
        isBot: true,
        hasQuery: !!data.sqlQuery,
        hasResult: !!data.result,
        hasError: !!data.error
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
      const errorMessage = {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        isBot: true,
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch('/api/chat/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setMessages([{
        text: "Hello! I'm your catalog assistant powered by Postgres MCP. You can ask me questions about your product catalog. For example, try asking 'Show me all products' or 'What's the most expensive product?'",
        isBot: true
      }]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Catalog Assistant (MCP)</h3>
        <button onClick={clearChat} className="clear-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      
      <div className="messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.isBot ? 'bot' : 'user'} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              {message.text.split('\n').map((line, i) => {
                // Check if the line starts with code block markers
                if (line.startsWith('```')) {
                  return null; // Skip the code block markers
                }
                
                // Check if we're inside a code block
                const codeBlockMatch = messages[index].text.match(/```(sql|json)?\s*([\s\S]*?)\s*```/g);
                if (codeBlockMatch) {
                  for (const block of codeBlockMatch) {
                    const blockContent = block.replace(/```(sql|json)?\s*|\s*```/g, '');
                    if (blockContent.includes(line)) {
                      return (
                        <pre key={i} className={
                          block.includes('```sql') ? 'sql-block' : 
                          block.includes('```json') ? 'json-block' : 
                          'code-block'
                        }>
                          {blockContent}
                        </pre>
                      );
                    }
                  }
                }
                
                // Handle markdown-style headers
                if (line.startsWith('**') && line.endsWith(':**')) {
                  return <h4 key={i}>{line.replace(/\*\*/g, '')}</h4>;
                }
                
                // Handle normal text
                return line ? <p key={i}>{line}</p> : <br key={i} />;
              })}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot loading">
            <div className="loading-indicator">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your catalog..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatAssistant;