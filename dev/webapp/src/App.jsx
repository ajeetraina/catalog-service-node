import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";
import { Chatbot } from "./Chatbot";
import sampleProducts from "./sample-products.json";

function App() {
  const [catalog, setCatalog] = useState(null);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const fetchCatalog = useCallback(() => {
    setErrorOccurred(false);

    fetch("/api/products")
      .then((response) => response.json())
      .then((data) => {
        setCatalog(data);
      })
      .catch((e) => {
        setErrorOccurred(e);
      });
  }, [setErrorOccurred, setCatalog]);

  const createProduct = useCallback(() => {
    const body = {
      price: 100 + Math.floor(Math.random() * 100),
      upc: 100000000000 + catalog.length + 1,
    };

    if (catalog.length < sampleProducts.length) {
      body.name = sampleProducts[catalog.length].name;
      body.description = sampleProducts[catalog.length].description;
    } else {
      body.name = `New Product #${catalog.length + 1}`;
      body.description = "A fancy description for an awesome product";
    }

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(fetchCatalog);
  }, [catalog, fetchCatalog]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <>
      <div className="app-header">
        <h1>Demo catalog client</h1>
        <div className="header-subtitle">
          <span>🤖 AI-Enhanced Product Catalog</span>
          <span className="ai-badge">Powered by Llama 3.2</span>
        </div>
      </div>

      <div className="app-actions">
        <button onClick={fetchCatalog} className="action-btn primary">
          Refresh catalog
        </button>
        <button onClick={createProduct} className="action-btn secondary">
          Create product
        </button>
        <button 
          onClick={toggleChatbot} 
          className={`action-btn chatbot-trigger ${isChatbotOpen ? 'active' : ''}`}
        >
          💬 {isChatbotOpen ? 'Close Chat' : 'Ask AI Assistant'}
        </button>
      </div>

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
                <div className="catalog-stats">
                  <span className="stat-item">
                    📊 {catalog.length} products in catalog
                  </span>
                  <span className="stat-item">
                    💰 Avg price: ${(catalog.reduce((sum, p) => sum + p.price, 0) / catalog.length).toFixed(2)}
                  </span>
                </div>
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>UPC</th>
                      <th>Inventory</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onChange={() => fetchCatalog()}
                      />
                    ))}
                  </tbody>
                </table>
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
                  An error occurred while fetching the catalog. Is the backend running?
                </p>
                <button onClick={fetchCatalog} className="action-btn primary">
                  Try again
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
    </>
  );
}

export default App;
