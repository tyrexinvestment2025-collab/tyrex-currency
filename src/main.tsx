import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Включаем консоль только в режиме разработки или если есть специальный параметр в URL
// Например: https://your-site.com?debug=true
// В продакшене лучше проверять import.meta.env.DEV
import VConsole from 'vconsole';

if (import.meta.env.DEV) {
  new VConsole();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    
    <App />
  </React.StrictMode>,
)