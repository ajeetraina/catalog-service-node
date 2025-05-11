// Chat Functionality JavaScript

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const exampleBtns = document.querySelectorAll('.example-btn');

// Chat Session
let sessionId = null;

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

exampleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Extract the text without the quotes
    const exampleText = btn.textContent.replace(/"/g, '');
    messageInput.value = exampleText;
    sendMessage();
  });
});

// Initialize chat when the chat view is shown
document.getElementById('chat-btn').addEventListener('click', () => {
  if (!sessionId) {
    initChat();
  }
});

// Functions
async function initChat() {
  try {
    const response = await fetch('/api/chat/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize chat');
    }
    
    const data = await response.json();
    sessionId = data.sessionId;
    
    // If there's history, display it
    if (data.history && data.history.length > 0) {
      displayChatHistory(data.history);
    }
  } catch (error) {
    console.error('Error initializing chat:', error);
    alert('Error initializing chat: ' + error.message);
  }
}

async function sendMessage() {
  const message = messageInput.value.trim();
  
  if (!message) {
    return;
  }
  
  // Initialize chat if not already done
  if (!sessionId) {
    await initChat();
  }
  
  // Add user message to UI
  addMessageToUI('user', message);
  
  // Clear input
  messageInput.value = '';
  
  // Add "typing" indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'message assistant-message typing-indicator';
  typingIndicator.innerHTML = '<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>';
  chatMessages.appendChild(typingIndicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  try {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        message
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    // Remove typing indicator
    chatMessages.removeChild(typingIndicator);
    
    const data = await response.json();
    
    // Add assistant response to UI
    addMessageToUI('assistant', data.text);
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Remove typing indicator
    if (typingIndicator.parentNode === chatMessages) {
      chatMessages.removeChild(typingIndicator);
    }
    
    // Add error message
    addMessageToUI('assistant', 'Sorry, there was an error processing your message. Please try again.');
  }
}

function addMessageToUI(sender, text) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${sender}-message`;
  
  // Process message text - format links, add line breaks, etc.
  const formattedText = formatMessage(text);
  
  messageEl.innerHTML = formattedText;
  
  // Add timestamp
  const timestampEl = document.createElement('div');
  timestampEl.className = 'message-time';
  timestampEl.textContent = new Date().toLocaleTimeString();
  messageEl.appendChild(timestampEl);
  
  chatMessages.appendChild(messageEl);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayChatHistory(history) {
  // Clear welcome message if present
  const welcomeMessage = chatMessages.querySelector('.welcome-message');
  if (welcomeMessage) {
    chatMessages.removeChild(welcomeMessage);
  }
  
  // Display each message in history
  history.forEach(message => {
    addMessageToUI(message.sender, message.text);
  });
}

function formatMessage(text) {
  // Convert URLs to links
  text = text.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank">$1</a>'
  );
  
  // Convert line breaks to <br>
  text = text.replace(/\n/g, '<br>');
  
  // Add special formatting for product details
  text = formatProductDetails(text);
  
  return text;
}

function formatProductDetails(text) {
  // Identify product IDs and convert them to clickable links
  return text.replace(
    /Product ID: (\d+)/g, 
    'Product ID: <a href="#" class="product-link" data-id="$1">$1</a>'
  );
}

// Add event delegation for dynamically created product links
chatMessages.addEventListener('click', e => {
  if (e.target.classList.contains('product-link')) {
    e.preventDefault();
    const productId = e.target.getAttribute('data-id');
    showProductDetails(productId);
  }
});

// This function is defined in catalog.js, but we declare it here for clarity
async function showProductDetails(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }
    
    const product = await response.json();
    
    document.getElementById('product-details').innerHTML = `
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
    
    document.getElementById('product-modal').style.display = 'block';
  } catch (error) {
    console.error('Error loading product details:', error);
    alert(`Error loading product details: ${error.message}`);
  }
}
