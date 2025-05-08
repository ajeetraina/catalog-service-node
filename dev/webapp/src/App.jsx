import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { ProductRow } from "./ProductRow";
import sampleProducts from "./sample-products.json";

function App() {
  const [catalog, setCatalog] = useState(null);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [randomMode, setRandomMode] = useState(true); // Default to random generation

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

  // Legacy create product with fixed data
  const createLegacyProduct = useCallback(() => {
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

    setIsCreating(true);

    fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => {
        fetchCatalog();
        setIsCreating(false);
      })
      .catch(error => {
        console.error("Error creating product:", error);
        setIsCreating(false);
      });
  }, [catalog, fetchCatalog]);

  // New function to generate a random product
  const createRandomProduct = useCallback(() => {
    setIsCreating(true);
    
    fetch("/api/random-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to generate random product");
        }
        return response.json();
      })
      .then(() => {
        fetchCatalog();
        setIsCreating(false);
      })
      .catch(error => {
        console.error("Error generating random product:", error);
        setIsCreating(false);
        setErrorOccurred(true);
      });
  }, [fetchCatalog]);

  // Combined create product function that uses random mode setting
  const createProduct = useCallback(() => {
    if (randomMode) {
      createRandomProduct();
    } else {
      createLegacyProduct();
    }
  }, [randomMode, createRandomProduct, createLegacyProduct]);

  // Toggle between random and legacy mode
  const toggleRandomMode = useCallback(() => {
    setRandomMode(prev => !prev);
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return (
    <>
      <h1>Demo catalog client</h1>

      <p>
        <button onClick={fetchCatalog}>Refresh catalog</button>
        &nbsp;
        <button 
          onClick={createProduct} 
          disabled={isCreating}
          style={{ 
            backgroundColor: randomMode ? '#4CAF50' : '#2196F3', 
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {isCreating ? 'Creating...' : randomMode ? 'Create Random Product' : 'Create Product'}
        </button>
        &nbsp;
        <button 
          onClick={toggleRandomMode} 
          style={{ 
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          Mode: {randomMode ? 'Random' : 'Fixed'}
        </button>
      </p>

      {catalog ? (
        <>
          {catalog.length === 0 ? (
            <em>There are no products... yet!</em>
          ) : (
            <table>
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
          )}
        </>
      ) : (
        <>
          {errorOccurred ? (
            <p>
              An error occurred while fetching the catalog. Is the backend
              running?
            </p>
          ) : (
            <p>Loading catalog...</p>
          )}
        </>
      )}
    </>
  );
}

export default App;
