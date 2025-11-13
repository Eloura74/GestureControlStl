// import React from "react";
// import { createRoot } from "react-dom/client";
// import AppV3 from "./AppV3.jsx"; // V3.0 Ultra-Optimisée avec damp + metrics
// createRoot(document.getElementById("root")).render(<AppV3 />);
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppV3Premium from './AppV3_Premium'  // ← CHANGE ICI
import './index.css'
import './premium.css'  // ← AJOUTE ICI

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppV3Premium />
)