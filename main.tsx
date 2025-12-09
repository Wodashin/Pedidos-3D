import React from 'react'
import ReactDOM from 'react-dom/client'
import Page from './app/page'
import './index.css' // Opcional: si tienes estilos globales, si no, borra esta línea

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)