/**
 * HUD V2 - Affichage temps réel des gestes avec mode FSM
 */

import React, { useState, useEffect } from "react";
import "./GesturesHUD.css"; // Réutilise le CSS existant

export default function GesturesHUDV2() {
  const [state, setState] = useState({
    rotX: 0,
    rotY: 0,
    zoom: 0,
    explode: 0,
    freeze: false,
    mode: "IDLE"
  });

  useEffect(() => {
    const handleHUD = (e) => {
      setState({
        rotX: e.detail.rotX || 0,
        rotY: e.detail.rotY || 0,
        zoom: e.detail.zoom || 0,
        explode: e.detail.explode || 0,
        freeze: e.detail.freeze || false,
        mode: e.detail.mode || "IDLE"
      });
    };

    window.addEventListener("holo:hud", handleHUD);
    return () => window.removeEventListener("holo:hud", handleHUD);
  }, []);

  // Mapping des modes pour affichage
  const modeColors = {
    IDLE: "#666",
    ROTATE: "#00ff88",
    ZOOM: "#00aaff",
    EXPLODE: "#ff6600",
    FREEZE: "#ffaa00"
  };

  return (
    <div className="gestures-hud">
      <div className="hud-header">
        <span className="hud-title">GESTES</span>
        <span className="hud-mode" style={{ color: modeColors[state.mode] }}>
          {state.mode}
        </span>
      </div>

      {/* Rotation X */}
      <div className="hud-row">
        <div className="hud-label">ROT X</div>
        <div className="hud-bar-container">
          <div
            className="hud-bar"
            style={{
              width: `${Math.min(Math.abs(state.rotX) * 5000, 100)}%`,
              backgroundColor: state.rotX > 0 ? "#00ff88" : "#ff6688",
              marginLeft: state.rotX < 0 ? "auto" : "0"
            }}
          />
        </div>
        <div className="hud-value">
          {(state.rotX * 100).toFixed(2)}
        </div>
      </div>

      {/* Rotation Y */}
      <div className="hud-row">
        <div className="hud-label">ROT Y</div>
        <div className="hud-bar-container">
          <div
            className="hud-bar"
            style={{
              width: `${Math.min(Math.abs(state.rotY) * 5000, 100)}%`,
              backgroundColor: state.rotY > 0 ? "#00aaff" : "#ff6688",
              marginLeft: state.rotY < 0 ? "auto" : "0"
            }}
          />
        </div>
        <div className="hud-value">
          {(state.rotY * 100).toFixed(2)}
        </div>
      </div>

      {/* Zoom */}
      <div className="hud-row">
        <div className="hud-label">ZOOM</div>
        <div className="hud-bar-container">
          <div
            className="hud-bar"
            style={{
              width: `${Math.min(Math.abs(state.zoom) * 1000, 100)}%`,
              backgroundColor: state.zoom > 0 ? "#ffaa00" : "#00ddff",
              marginLeft: state.zoom < 0 ? "auto" : "0"
            }}
          />
        </div>
        <div className="hud-value">
          {(state.zoom * 10).toFixed(2)}
        </div>
      </div>

      {/* Explosion */}
      <div className="hud-row">
        <div className="hud-label">EXPLODE</div>
        <div className="hud-bar-container">
          <div
            className="hud-bar explode-bar"
            style={{
              width: `${state.explode * 100}%`,
              backgroundColor: `hsl(${280 - state.explode * 160}, 100%, 60%)`
            }}
          />
        </div>
        <div className="hud-value">{(state.explode * 100).toFixed(0)}%</div>
      </div>

      {/* Indicateur Freeze */}
      {state.freeze && (
        <div className="hud-freeze">
          <span className="freeze-icon">❄️</span>
          <span className="freeze-text">FREEZE</span>
        </div>
      )}

      {/* Footer info */}
      <div className="hud-footer">
        <span className="hud-hint">V2.0 | Kalman+FSM</span>
      </div>
    </div>
  );
}
