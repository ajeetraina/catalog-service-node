import { useCallback, useState, useEffect } from "react";
import productImage from "./product-image.png";

export function ProductRow({ product, onChange }) {
  const [inventoryDetails, setInventoryDetails] = useState(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  // Force image refresh periodically
  useEffect(() => {
    // Refresh image URL timestamp every time the product changes
    setTimestamp(Date.now());
  }, [product]);

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
          .then(() => setTimestamp(Date.now())) // Update timestamp after upload
          .then(() => onChange());
      });
  }, [product.id, onChange]);

  // Build image URL with cache-busting query parameter
  const imageUrl = `${product.id}/image?t=${timestamp}`;

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
            src={`/api/products/${imageUrl}`} 
            alt={product.name} 
            style={{ maxWidth: '100px', maxHeight: '100px' }}
            key={timestamp} // Force React to recreate the img element
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
