/**
 * HOLO-CONTROL V3 PREMIUM - Entry Point
 * Point d'entrée pour version Premium avec effets visuels avancés
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import AppV3Premium from './AppV3_Premium'
import './index.css'
import './premium.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppV3Premium />
  </React.StrictMode>,
)
