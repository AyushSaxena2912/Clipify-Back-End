import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'  // Add .jsx extension
import './index.css'

console.log('main.jsx is running'); // Add this for debugging

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)