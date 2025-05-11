document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    const socket = io();
    
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const productsContainer = document.getElementById('products-container');
    
    // Bootstrap modal
    const productModal = new bootstrap.Modal(document.getElementById('productModal'));
    const productModalBody = document.getElementById('productModalBody');
    
    // Add event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Load products on page load
    loadProducts();
    
    // Add welcome message
    addMessage('Hello! I\'m your product catalog assistant. I can help you:' +
        '<ul>' +
        '<li>List all products</li>' +
        '<li>Find products by name, category, or price range</li>' +
        '<li>Add new products</li>' +
        '<li>Delete products</li>' +
        '</ul>' +
        'How can I assist you today?', 'assistant');
    
    // Functions
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        userInput.value = '';
        
        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'assistant-message', 'typing-indicator');
        typingIndicator.innerHTML = '<span>.</span><span>.</span><span>.</span>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // Send message to server
        socket.emit('chat message', { message });
    }
    
    function addMessage(message, sender) {
        // Remove typing indicator if exists
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = message;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            productsContainer.innerHTML = '';
            products.forEach(product => {
                const productCard = createProductCard(product);
                productsContainer.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }
    
    function createProductCard(product) {
        const colDiv = document.createElement('div');
        colDiv.classList.add('col-md-4', 'mb-4');
        
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('product-card');
        cardDiv.addEventListener('click', () => showProductDetails(product));
        
        let productImage;
        if (product.has_image) {
            productImage = document.createElement('img');
            productImage.src = `/api/products/${product.id}/image`;
            productImage.alt = product.name;
            productImage.classList.add('product-image');
        } else {
            productImage = document.createElement('div');
            productImage.classList.add('product-placeholder');
            productImage.textContent = 'No image';
        }
        
        const productTitle = document.createElement('h5');
        productTitle.classList.add('product-title');
        productTitle.textContent = product.name;
        
        const productPrice = document.createElement('div');
        productPrice.classList.add('product-price');
        productPrice.textContent = `$${product.price.toFixed(2)}`;
        
        const productDescription = document.createElement('p');
        productDescription.classList.add('product-description');
        productDescription.textContent = product.description || 'No description available';
        
        cardDiv.appendChild(productImage);
        cardDiv.appendChild(productTitle);
        cardDiv.appendChild(productPrice);
        cardDiv.appendChild(productDescription);
        
        colDiv.appendChild(cardDiv);
        return colDiv;
    }
    
    function showProductDetails(product) {
        productModalBody.innerHTML = '';
        
        if (product.has_image) {
            const img = document.createElement('img');
            img.src = `/api/products/${product.id}/image`;
            img.alt = product.name;
            productModalBody.appendChild(img);
        }
        
        const title = document.createElement('h4');
        title.textContent = product.name;
        
        const price = document.createElement('h5');
        price.classList.add('text-danger');
        price.textContent = `$${product.price.toFixed(2)}`;
        
        const description = document.createElement('p');
        description.textContent = product.description || 'No description available';
        
        const category = document.createElement('p');
        category.innerHTML = `<strong>Category:</strong> ${product.category || 'Uncategorized'}`;
        
        const created = document.createElement('p');
        created.innerHTML = `<strong>Added:</strong> ${new Date(product.created_at).toLocaleDateString()}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-danger', 'mt-3');
        deleteBtn.textContent = 'Delete Product';
        deleteBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${product.name}?`)) {
                try {
                    // Using the chat interface to delete through MCP
                    socket.emit('chat message', { 
                        message: `delete product ${product.id}`,
                        isSystemAction: true 
                    });
                    
                    productModal.hide();
                    // Reload will happen when server confirms deletion
                } catch (error) {
                    console.error('Error deleting product:', error);
                    alert('Failed to delete product');
                }
            }
        });
        
        productModalBody.appendChild(title);
        productModalBody.appendChild(price);
        productModalBody.appendChild(description);
        productModalBody.appendChild(category);
        productModalBody.appendChild(created);
        productModalBody.appendChild(deleteBtn);
        
        productModal.show();
    }
    
    // Socket event handlers
    socket.on('chat response', (data) => {
        addMessage(data.message, 'assistant');
        
        // If the response indicates a product operation was completed, refresh the products
        if (data.productAction) {
            loadProducts();
        }
    });
    
    socket.on('product action', (data) => {
        const { type, product } = data;
        
        const actionCard = document.createElement('div');
        actionCard.classList.add('product-action-card');
        
        if (type === 'add') {
            actionCard.innerHTML = `
                <div><strong>Add New Product</strong></div>
                <div>Name: ${product.name}</div>
                <div>Price: $${product.price.toFixed(2)}</div>
                <div>Description: ${product.description}</div>
                <div>Category: ${product.category || 'Uncategorized'}</div>
                <div class="action-buttons">
                    <button class="confirm-btn">Confirm</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;
            
            chatMessages.appendChild(actionCard);
            scrollToBottom();
            
            const confirmBtn = actionCard.querySelector('.confirm-btn');
            const cancelBtn = actionCard.querySelector('.cancel-btn');
            
            confirmBtn.addEventListener('click', async () => {
                actionCard.innerHTML = '<div>Adding product...</div>';
                
                try {
                    socket.emit('confirm action', { type, product });
                } catch (error) {
                    console.error('Error adding product:', error);
                    actionCard.innerHTML = '<div>Failed to add product.</div>';
                }
            });
            
            cancelBtn.addEventListener('click', () => {
                actionCard.remove();
                addMessage('Product addition cancelled.', 'assistant');
            });
        } else if (type === 'delete') {
            actionCard.innerHTML = `
                <div><strong>Delete Product</strong></div>
                <div>Are you sure you want to delete "${product.name}"?</div>
                <div class="action-buttons">
                    <button class="confirm-btn">Confirm</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            `;
            
            chatMessages.appendChild(actionCard);
            scrollToBottom();
            
            const confirmBtn = actionCard.querySelector('.confirm-btn');
            const cancelBtn = actionCard.querySelector('.cancel-btn');
            
            confirmBtn.addEventListener('click', async () => {
                actionCard.innerHTML = '<div>Deleting product...</div>';
                
                try {
                    socket.emit('confirm action', { type, productId: product.id });
                } catch (error) {
                    console.error('Error deleting product:', error);
                    actionCard.innerHTML = '<div>Failed to delete product.</div>';
                }
            });
            
            cancelBtn.addEventListener('click', () => {
                actionCard.remove();
                addMessage('Product deletion cancelled.', 'assistant');
            });
        }
    });
    
    socket.on('action complete', (data) => {
        const { success, message, type } = data;
        
        // Remove action card if it exists
        const actionCard = document.querySelector('.product-action-card');
        if (actionCard) {
            actionCard.remove();
        }
        
        addMessage(message, 'assistant');
        
        if (success) {
            loadProducts();
        }
    });
});
