import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";
import { ChatBot } from "./ChatBot";
import sampleProducts from "./sample-products.json";

function App() {
  const [catalog, setCatalog] = useState(null);
  const [errorOccurred, setErrorOccurred] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const fetchCatalog = useCallback(() => {
    setErrorOccurred(false);

    fetch(`${apiBaseUrl}/api/products`)
      .then((response) => response.json())
      .then((data) => {
        setCatalog(data);
      })
      .catch((e) => {
        setErrorOccurred(e);
      });
  }, [setErrorOccurred, setCatalog, apiBaseUrl]);

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

    fetch(`${apiBaseUrl}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(fetchCatalog);
  }, [catalog, fetchCatalog, apiBaseUrl]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return (
    <>
      <div className="header-section">
        <h1>🛍️ Product Catalog with AI Assistant</h1>
        <p className="subtitle">Browse our products and chat with our AI assistant for help!</p>
      </div>

      <div className="controls-section">
        <button onClick={fetchCatalog} className="control-button">
          🔄 Refresh catalog
        </button>
        <button onClick={createProduct} className="control-button">
          ➕ Create product
        </button>
      </div>

      <div className="catalog-section">
        {catalog ? (
          <>
            {catalog.length === 0 ? (
              <div className="empty-state">
                <p>There are no products... yet!</p>
                <p>Click "Create product" to add some items to the catalog.</p>
              </div>
            ) : (
              <div className="products-container">
                <h2>Products ({catalog.length})</h2>
                <div className="table-container">
                  <table className="products-table">
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
                          apiBaseUrl={apiBaseUrl}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="loading-section">
            {errorOccurred ? (
              <div className="error-state">
                <p>⚠️ An error occurred while fetching the catalog.</p>
                <p>Is the backend running on {apiBaseUrl}?</p>
              </div>
            ) : (
              <div className="loading-state">
                <p>📦 Loading catalog...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <ChatBot />
    </>
  );
}

export default App;
