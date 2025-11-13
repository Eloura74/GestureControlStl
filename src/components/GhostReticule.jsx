/**
 * GHOST RETICULE 3D
 * Réticule holographique flottant qui suit la main détectée
 * Affiche visuellement le geste en cours
 */

import React, { useState, useEffect } from "react";
import "./GhostReticule.css";

export default function GhostReticule() {
  const [mode, setMode] = useState("IDLE");
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Position en %

  useEffect(() => {
    const handleHUD = (e) => {
      const newMode = e.detail.mode || "IDLE";
      setMode(newMode);
      setVisible(newMode !== "IDLE");

      // Simuler position de la main (centre écran avec variations)
      // En production, vous pouvez passer les coords réelles depuis le backend
      if (newMode !== "IDLE") {
        setPosition({
          x: 50 + Math.sin(Date.now() / 1000) * 5,
          y: 50 + Math.cos(Date.now() / 1000) * 5
        });
      }
    };

    window.addEventListener("holo:hud", handleHUD);
    return () => window.removeEventListener("holo:hud", handleHUD);
  }, []);

  const reticuleStyles = {
    ROTATE: {
      animation: "reticuleRotate 2s linear infinite",
      borderColor: "#00ff88"
    },
    ZOOM: {
      animation: "reticuleZoom 1s ease-in-out infinite",
      borderColor: "#00aaff"
    },
    EXPLODE: {
      animation: "reticuleExplode 0.5s ease-in-out infinite",
      borderColor: "#ff6600"
    },
    FREEZE: {
      animation: "none",
      borderColor: "#ffaa00"
    }
  };

  const currentStyle = reticuleStyles[mode] || {};

  return (
    <div
      className={`ghost-reticule ${visible ? "visible" : ""}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        borderColor: currentStyle.borderColor,
        animation: currentStyle.animation
      }}
    >
      <div className="reticule-center" />
      <div className="reticule-ring ring-1" />
      <div className="reticule-ring ring-2" />
      <div className="reticule-line line-top" />
      <div className="reticule-line line-right" />
      <div className="reticule-line line-bottom" />
      <div className="reticule-line line-left" />
    </div>
  );
}
