import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";
import { Chatbot } from "./Chatbot";

function App() {
  const [catalog, setCatalog] = useState(null);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [catalogStats, setCatalogStats] = useState(null);

  const fetchCatalog = useCallback(async () => {
    setErrorOccurred(false);
    
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCatalog(data);
      
      // Also fetch stats
      try {
        const statsResponse = await fetch("/api/catalog-stats");
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setCatalogStats(stats);
        }
      } catch (statsError) {
        console.log('Could not fetch catalog stats:', statsError);
      }
      
    } catch (error) {
      console.error('Error fetching catalog:', error);
      setErrorOccurred(true);
    }
  }, []);

  const createProduct = useCallback(async () => {
    if (!catalog) return;
    
    const sampleProducts = [
      { name: "Wireless Headphones", description: "High-quality wireless headphones with noise cancellation" },
      { name: "Smart Watch", description: "Advanced fitness tracking and notification features" },
      { name: "Laptop Stand", description: "Ergonomic adjustable laptop stand for better posture" },
      { name: "USB-C Hub", description: "Multi-port USB-C hub with HDMI and USB 3.0 ports" },
      { name: "Bluetooth Speaker", description: "Portable waterproof speaker with excellent sound quality" }
    ];
    
    const body = {
      price: 50 + Math.floor(Math.random() * 200),
      upc: `${1000000000000 + catalog.length + 1}`,
    };

    if (catalog.length < sampleProducts.length) {
      body.name = sampleProducts[catalog.length].name;
      body.description = sampleProducts[catalog.length].description;
    } else {
      body.name = `New Product #${catalog.length + 1}`;
      body.description = "A fantastic product with amazing features";
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        fetchCatalog();
      } else {
        console.error('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
    }
  }, [catalog, fetchCatalog]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>🤖 AI-Enhanced Product Catalog</h1>
        <div className="header-subtitle">
          <span>Powered by Docker Model Runner + Llama 3.2</span>
          <div className="ai-badge">Smart Catalog Assistant</div>
        </div>
      </div>

      <div className="app-actions">
        <button onClick={fetchCatalog} className="action-btn primary">
          🔄 Refresh Catalog
        </button>
        <button onClick={createProduct} className="action-btn secondary">
          ➕ Create Product
        </button>
        <button 
          onClick={toggleChatbot} 
          className={`action-btn chatbot-trigger ${isChatbotOpen ? 'active' : ''}`}
        >
          💬 {isChatbotOpen ? 'Close Assistant' : 'Ask AI Assistant'}
        </button>
      </div>

      {catalogStats && (
        <div className="catalog-stats">
          <div className="stat-card">
            <span className="stat-number">{catalogStats.totalProducts}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">${catalogStats.averagePrice}</span>
            <span className="stat-label">Avg Price</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{catalogStats.hasImages || 0}</span>
            <span className="stat-label">With Images</span>
          </div>
        </div>
      )}

      <div className="catalog-content">
        {catalog ? (
          <>
            {catalog.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h3>No products yet!</h3>
                <p>Start by creating your first product or ask the AI assistant for help.</p>
                <button onClick={createProduct} className="action-btn primary">
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="catalog-table-container">
                <div className="table-header">
                  <h2>Product Catalog ({catalog.length} items)</h2>
                  <div className="table-actions">
                    <span className="last-updated">
                      Last updated: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="table-wrapper">
                  <table className="catalog-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>UPC</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((product) => (
                        <ProductRow
                          key={product.id}
                          product={product}
                          onChange={fetchCatalog}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="loading-state">
            {errorOccurred ? (
              <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>
                  Unable to connect to the catalog service. Please check if the backend is running.
                </p>
                <button onClick={fetchCatalog} className="action-btn primary">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="loading-content">
                <div className="loading-spinner"></div>
                <h3>Loading catalog...</h3>
                <p>Fetching your amazing products</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chatbot Component */}
      <Chatbot isOpen={isChatbotOpen} onToggle={toggleChatbot} />
      
      <footer className="app-footer">
        <p>AI-Enhanced Product Catalog • Powered by Docker Model Runner & Llama 3.2</p>
      </footer>
    </div>
  );
}

export default App;
