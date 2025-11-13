/**
 * GESTURE INDICATOR - Indicateur central animé du geste actif
 * Affiche une icône holographique au centre de l'écran
 */

import React, { useState, useEffect } from "react";
import "./GestureIndicator.css";

export default function GestureIndicator() {
  const [currentMode, setCurrentMode] = useState("IDLE");
  const [visible, setVisible] = useState(false);

  const gestureIcons = {
    IDLE: { icon: "◌", label: "IDLE", color: "#666" },
    ROTATE: { icon: "↻", label: "ROTATION", color: "#00ff88" },
    ZOOM: { icon: "🔍", label: "ZOOM", color: "#00aaff" },
    EXPLODE: { icon: "💥", label: "EXPLOSION", color: "#ff6600" },
    FREEZE: { icon: "❄️", label: "FREEZE", color: "#ffaa00" }
  };

  useEffect(() => {
    let hideTimeout;

    const handleHUD = (e) => {
      const mode = e.detail.mode || "IDLE";
      setCurrentMode(mode);

      // Afficher l'indicateur sauf pour IDLE
      if (mode !== "IDLE") {
        setVisible(true);
        
        // Cache après 2 secondes d'inactivité
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          if (mode === "IDLE") {
            setVisible(false);
          }
        }, 2000);
      } else {
        // Fade out pour IDLE
        setTimeout(() => setVisible(false), 300);
      }
    };

    window.addEventListener("holo:hud", handleHUD);
    return () => {
      window.removeEventListener("holo:hud", handleHUD);
      clearTimeout(hideTimeout);
    };
  }, []);

  const currentGesture = gestureIcons[currentMode] || gestureIcons.IDLE;

  return (
    <div 
      className={`gesture-indicator ${visible ? 'visible' : ''}`}
      style={{
        '--gesture-color': currentGesture.color
      }}
    >
      <div className="gesture-icon">
        {currentGesture.icon}
      </div>
      <div className="gesture-label">
        {currentGesture.label}
      </div>
      <div className="gesture-ring" />
    </div>
  );
}
