import { useCallback, useState, useEffect, useRef } from "react";
import productImage from "./product-image.png";

export function ProductRow({ product, onChange }) {
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [imgSrc, setImgSrc] = useState(null);
  const imgRef = useRef(null);

  // Force image refresh periodically
  useEffect(() => {
    // Generate a new timestamp for the image URL
    setTimestamp(Date.now());
    
    // Create a unique image URL with timestamp to prevent caching
    if (product.has_image) {
      const imageUrl = `/api/products/${product.id}/image?t=${timestamp}&nocache=${Math.random()}`;
      setImgSrc(imageUrl);
    }
  }, [product, product.id, product.has_image]);

  const fetchInventoryDetails = useCallback(() => {
    fetch(`/api/products/${product.id}`)
      .then((response) => response.json())
      .then(({ inventory }) => setInventoryDetails(inventory))
      .then(() => onChange());
  }, [product.id, onChange, setInventoryDetails]);

  const uploadImage = useCallback(() => {
    fetch(productImage)
      .then((r) => r.blob())
      .then((fileBlob) => {
        const file = new File([fileBlob], "product-image.png", {
          type: "image/png",
        });

        const formData = new FormData();
        formData.append("file", file);

        fetch(`/api/products/${product.id}/image`, {
          method: "POST",
          body: formData,
        })
          .then(() => {
            // Force reload the image by updating timestamp
            setTimestamp(Date.now());
            onChange(); // Refresh the product data
          });
      });
  }, [product.id, onChange]);

  // This function is used to force reload the image when clicking on it
  const reloadImage = useCallback(() => {
    if (imgRef.current) {
      // Force browser to reload by setting a new src
      setTimestamp(Date.now());
      
      // This is a hack to force the browser to actually reload the image
      const img = imgRef.current;
      img.src = `/api/products/${product.id}/image?t=${Date.now()}&forcereload=${Math.random()}`;
      
      // Also trigger the parent's onChange handler to refresh product data
      onChange();
    }
  }, [product.id, onChange]);

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
          <img 
            ref={imgRef}
            src={imgSrc}
            alt={product.name} 
            style={{ 
              maxWidth: '100px', 
              maxHeight: '100px',
              cursor: 'pointer',
              border: '1px solid #ccc'
            }}
            onClick={reloadImage}
            title="Click to reload image"
            key={`img-${product.id}-${timestamp}`} // Force React to recreate the img element
          />
        ) : (
          <button className="smaller" onClick={uploadImage}>
            Upload
          </button>
        )}
      </td>
    </tr>
  );
}
