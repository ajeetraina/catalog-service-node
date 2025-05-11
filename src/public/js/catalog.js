// Product Catalog JavaScript

// DOM Elements
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const randomProductBtn = document.getElementById('random-product-btn');
const productModal = document.getElementById('product-modal');
const productDetails = document.getElementById('product-details');
const closeBtn = document.querySelector('.close');

// Event Listeners
searchBtn.addEventListener('click', searchProducts);
searchInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    searchProducts();
  }
});

randomProductBtn.addEventListener('click', addRandomProduct);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === productModal) {
    closeModal();
  }
});

// Load products on page load
loadProducts();

// Functions
async function loadProducts() {
  productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
  
  try {
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const products = await response.json();
    
    if (products.length === 0) {
      productsContainer.innerHTML = '<div class="no-products">No products found. Try adding some!</div>';
      return;
    }
    
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    productsContainer.innerHTML = `<div class="error">Error loading products: ${error.message}</div>`;
  }
}

function displayProducts(products, searchTerm = '') {
  productsContainer.innerHTML = '';
  
  let filteredProducts = products;
  
  // Filter products if search term provided
  if (searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }
  
  if (filteredProducts.length === 0) {
    productsContainer.innerHTML = `
      <div class="no-products">
        No products found${searchTerm ? ` matching "${searchTerm}"` : ''}. 
        ${searchTerm ? 'Try a different search term.' : 'Try adding some!'}
      </div>
    `;
    return;
  }
  
  filteredProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    const hasImage = product.has_image || false;
    
    productCard.innerHTML = `
      <div class="product-image">
        ${hasImage 
          ? `<img src="/api/products/${product.id}/image" alt="${product.name}" loading="lazy">` 
          : `<div class="no-image">No image available</div>`
        }
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        ${product.description 
          ? `<div class="product-description">${product.description}</div>` 
          : ''
        }
        <button class="view-details-btn" data-id="${product.id}">View Details</button>
      </div>
    `;
    
    productsContainer.appendChild(productCard);
    
    // Add event listener to the button
    const viewDetailsBtn = productCard.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', () => {
      showProductDetails(product.id);
    });
  });
}

function searchProducts() {
  const searchTerm = searchInput.value.trim();
  
  // If the search term is empty, just reload all products
  if (!searchTerm) {
    loadProducts();
    return;
  }
  
  // Get all products and filter client-side for simplicity
  // For a larger catalog, this would be better done server-side
  fetch('/api/products')
    .then(response => response.json())
    .then(products => {
      displayProducts(products, searchTerm);
    })
    .catch(error => {
      console.error('Error searching products:', error);
      productsContainer.innerHTML = `<div class="error">Error searching products: ${error.message}</div>`;
    });
}

async function showProductDetails(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }
    
    const product = await response.json();
    
    productDetails.innerHTML = `
      <div class="product-details">
        <div class="product-details-image">
          ${product.has_image 
            ? `<img src="/api/products/${product.id}/image" alt="${product.name}">` 
            : `<div class="no-image">No image available</div>`
          }
        </div>
        <div class="product-details-info">
          <h2 class="product-details-name">${product.name}</h2>
          <div class="product-details-price">$${product.price.toFixed(2)}</div>
          ${product.description 
            ? `<div class="product-details-description">${product.description}</div>` 
            : ''
          }
          
          ${product.inventory 
            ? `<div class="product-inventory">
                <p>In Stock: ${product.inventory.inStock ? 'Yes' : 'No'}</p>
                <p>Quantity Available: ${product.inventory.quantity}</p>
               </div>` 
            : ''
          }
          
          <div class="product-details-metadata">
            <p><strong>Product ID:</strong> ${product.id}</p>
            <p><strong>UPC:</strong> ${product.upc}</p>
          </div>
        </div>
      </div>
    `;
    
    productModal.style.display = 'block';
  } catch (error) {
    console.error('Error loading product details:', error);
    alert(`Error loading product details: ${error.message}`);
  }
}

function closeModal() {
  productModal.style.display = 'none';
}

async function addRandomProduct() {
  try {
    randomProductBtn.disabled = true;
    randomProductBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    const response = await fetch('/api/random-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to add random product');
    }
    
    const product = await response.json();
    
    // Reload products to show the new one
    loadProducts();
    
    // Show a success message
    alert(`Successfully added random product: ${product.name}`);
  } catch (error) {
    console.error('Error adding random product:', error);
    alert(`Error adding random product: ${error.message}`);
  } finally {
    randomProductBtn.disabled = false;
    randomProductBtn.innerHTML = '<i class="fas fa-random"></i> Add Random Product';
  }
}
