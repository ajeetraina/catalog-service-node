// Main JavaScript - Navigation and Coordination

// DOM Elements
const viewCatalogBtn = document.getElementById('view-catalog-btn');
const chatBtn = document.getElementById('chat-btn');
const catalogView = document.getElementById('catalog-view');
const chatView = document.getElementById('chat-view');

// Event Listeners
viewCatalogBtn.addEventListener('click', showCatalogView);
chatBtn.addEventListener('click', showChatView);

// Functions
function showCatalogView(e) {
  if (e) e.preventDefault();
  
  // Update active tab
  viewCatalogBtn.classList.add('active');
  chatBtn.classList.remove('active');
  
  // Show/hide views
  catalogView.classList.add('active-view');
  chatView.classList.remove('active-view');
}

function showChatView(e) {
  if (e) e.preventDefault();
  
  // Update active tab
  viewCatalogBtn.classList.remove('active');
  chatBtn.classList.add('active');
  
  // Show/hide views
  catalogView.classList.remove('active-view');
  chatView.classList.add('active-view');
}

// Add CSS class for typing indicator animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes typing-dots {
    0%, 20% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  .typing-dots span {
    animation: typing-dots 1.4s infinite;
    animation-fill-mode: both;
    font-size: 24px;
    line-height: 8px;
  }
  
  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }
`;
document.head.appendChild(styleSheet);
