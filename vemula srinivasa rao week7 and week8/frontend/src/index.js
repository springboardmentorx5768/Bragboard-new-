import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// BLOCK WebSocket connections to prevent errors
if (typeof window !== 'undefined') {
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    console.log('WebSocket attempted:', url);
    
    // Block connections to localhost:3000
    if (url && (url.includes('localhost:3000') || url.includes('ws://'))) {
      console.log('Blocking WebSocket to prevent errors');
      
      // Return a dummy object that won't crash
      const dummySocket = {
        readyState: 3, // CLOSED
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        send: () => console.log('WebSocket blocked'),
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      };
      
      // Simulate connection failure
      setTimeout(() => {
        if (typeof dummySocket.onerror === 'function') {
          const error = new Error('WebSocket connection blocked');
          dummySocket.onerror({ error });
        }
      }, 50);
      
      return dummySocket;
    }
    
    // Allow other WebSocket connections
    return new OriginalWebSocket(url, protocols);
  };
  
  // Copy static properties
  Object.assign(window.WebSocket, OriginalWebSocket);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);