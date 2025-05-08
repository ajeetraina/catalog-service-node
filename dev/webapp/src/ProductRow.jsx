import { useCallback, useState, useEffect, useRef } from "react";
import productImage from "./product-image.png";

export function ProductRow({ product, onChange }) {
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [imageState, setImageState] = useState({
    loading: true,
    error: false,
    retries: 0,
    url: null
  });
  const imgRef = useRef(null);

  // Generate a new image URL for this product with cache-busting
  useEffect(() => {
    if (product && product.has_image) {
      const cacheBuster = `nocache=${Date.now()}-${Math.random()}`;
      const baseUrl = `/api/products/${product.id}/image`;
      const url = `${baseUrl}?${cacheBuster}`;
      
      setImageState(prev => ({
        ...prev,
        loading: true,
        url: url
      }));
    }
  }, [product]);

  const fetchInventoryDetails = useCallback(() => {
    fetch(`/api/products/${product.id}`)
      .then((response) => response.json())
      .then(({ inventory }) => setInventoryDetails(inventory))
      .then(() => onChange());
  }, [product.id, onChange, setInventoryDetails]);

  const uploadImage = useCallback(() => {
    // Set loading state
    setImageState(prev => ({
      ...prev,
      loading: true,
      error: false
    }));
    
    fetch(productImage)
      .then((r) => r.blob())
      .then((fileBlob) => {
        const file = new File([fileBlob], "product-image.png", {
          type: "image/png",
        });

        const formData = new FormData();
        formData.append("file", file);

        return fetch(`/api/products/${product.id}/image`, {
          method: "POST",
          body: formData,
        });
      })
      .then(() => {
        // Force a complete product data refresh
        onChange();
        
        // Wait a moment to let S3 propagate, then update UI
        setTimeout(() => {
          const cacheBuster = `nocache=${Date.now()}-${Math.random()}`;
          const url = `/api/products/${product.id}/image?${cacheBuster}`;
          
          setImageState({
            loading: false,
            error: false,
            retries: 0,
            url: url
          });
        }, 500);
      })
      .catch(error => {
        console.error("Error uploading image:", error);
        setImageState(prev => ({
          ...prev,
          loading: false,
          error: true
        }));
      });
  }, [product.id, onChange]);

  // Handle image load error - retry with exponential backoff
  const handleImageError = useCallback(() => {
    if (imageState.retries < 3) {
      console.log(`Image load failed for product ${product.id}, retrying... (${imageState.retries + 1}/3)`);
      setTimeout(() => {
        const cacheBuster = `retry=${Date.now()}-${Math.random()}`;
        const baseUrl = `/api/products/${product.id}/image`;
        const url = `${baseUrl}?${cacheBuster}`;
        
        setImageState(prev => ({
          ...prev,
          loading: true,
          retries: prev.retries + 1,
          url: url
        }));
      }, Math.pow(2, imageState.retries) * 500); // Exponential backoff: 500ms, 1000ms, 2000ms
    } else {
      console.error(`Failed to load image for product ${product.id} after multiple attempts`);
      setImageState(prev => ({
        ...prev,
        loading: false,
        error: true
      }));
    }
  }, [product.id, imageState.retries]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      loading: false,
      error: false
    }));
  }, []);

  return (
    <tr>
      <td>{product.id}</td>
      <td>{product.name}</td>
      <td>{product.description}</td>
      <td>{product.price}</td>
      <td>{product.upc}</td>
      <td>
        {inventoryDetails ? (
          <>
            {inventoryDetails.error ? (
              <span className="error">{inventoryDetails.message}</span>
            ) : (
              <span>{inventoryDetails.quantity}</span>
            )}
          </>
        ) : (
          <button className="smaller" onClick={fetchInventoryDetails}>
            Fetch
          </button>
        )}
      </td>
      <td>
        {product.has_image ? (
          <div style={{ textAlign: 'center' }}>
            {imageState.loading && <div>Loading...</div>}
            
            {imageState.error ? (
              <div>
                <div style={{ color: 'red' }}>Error loading image</div>
                <button className="smaller" onClick={uploadImage}>
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <img 
                  ref={imgRef}
                  src={imageState.url}
                  alt={`Product ${product.id}`}
                  style={{ 
                    maxWidth: '100px', 
                    maxHeight: '100px',
                    border: '1px solid #ccc',
                    display: imageState.loading ? 'none' : 'block'
                  }}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  key={`img-${product.id}-${imageState.url}`} // Force React to recreate the img element
                />
                <div style={{ 
                  fontSize: '12px', 
                  marginTop: '4px',
                  color: '#666'
                }}>
                  ID: {product.id}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="smaller" onClick={uploadImage}>
            Upload
          </button>
        )}
      </td>
    </tr>
  );
}
