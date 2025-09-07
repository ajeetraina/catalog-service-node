import { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:3001';

export function Chatbot({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your catalog assistant. I can help you find products, answer questions about our inventory, and provide recommendations. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Prepare conversation history for the API
      const conversationHistory = messages
        .filter(msg => msg.sender !== "system")
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        }));

      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputText,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: "bot",
        timestamp: new Date(),
        model: data.model,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting to my AI brain right now. But I can still help you! Try browsing the products above or ask me simple questions about the catalog.",
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Chat cleared! How can I help you with the product catalog?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button 
        className="chatbot-toggle" 
        onClick={onToggle}
        title="Open Product Catalog Assistant"
      >
        💬 Chat
      </button>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-icon">🤖</span>
          <span>Catalog Assistant</span>
          <span className="chatbot-status">● Online</span>
        </div>
        <div className="chatbot-controls">
          <button onClick={clearChat} className="clear-btn" title="Clear chat">
            🗑️
          </button>
          <button onClick={onToggle} className="close-btn" title="Close chat">
            ✕
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              <p>{message.text}</p>
              <div className="message-meta">
                <span className="timestamp">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {message.model && (
                  <span className="model-info">via {message.model}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about products, prices, or anything about the catalog..."
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? "⏳" : "📤"}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
