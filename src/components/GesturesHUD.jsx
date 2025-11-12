import React, { useEffect, useState } from "react";
import "./GesturesHUD.css";

export default function GesturesHUD() {
  const [state, setState] = useState({
    rotX: 0,
    rotY: 0,
    zoom: 0,
    explode: 0,
    freeze: false,
  });

  useEffect(() => {
    const handler = (e) => {
      setState({
        rotX: e.detail.rotX || 0,
        rotY: e.detail.rotY || 0,
        zoom: e.detail.zoom || 0,
        explode: e.detail.explode || 0,
        freeze: e.detail.freeze || false,
      });
    };
    window.addEventListener("holo:hud", handler);
    return () => window.removeEventListener("holo:hud", handler);
  }, []);

  // Normalisation pour affichage (barres -100 à +100)
  const normalizeRot = (val) => Math.max(-100, Math.min(100, val * 2000));
  const normalizeZoom = (val) => Math.max(-100, Math.min(100, val * 50));
  const explodePercent = Math.round(state.explode * 100);

  const rotXNorm = normalizeRot(state.rotX);
  const rotYNorm = normalizeRot(state.rotY);
  const zoomNorm = normalizeZoom(state.zoom);

  return (
    <div className="hud-container">
      <div className="hud-panel">
        <div className="hud-title">GESTES</div>

        {/* Freeze indicator */}
        {state.freeze && (
          <div className="freeze-indicator">
            <div className="freeze-icon">❄</div>
            <div className="freeze-text">FREEZE</div>
          </div>
        )}

        {/* Rotation X (haut/bas) */}
        <div className="hud-item">
          <div className="hud-label">ROT X</div>
          <div className="hud-bar-container">
            <div className="hud-bar-track">
              <div className="hud-bar-center" />
              <div
                className="hud-bar-fill"
                style={{
                  width: `${Math.abs(rotXNorm)}%`,
                  left: rotXNorm < 0 ? `${50 + rotXNorm}%` : "50%",
                  backgroundColor: rotXNorm < 0 ? "#ff4466" : "#44ff66",
                }}
              />
            </div>
            <div className="hud-value">{rotXNorm.toFixed(0)}</div>
          </div>
        </div>

        {/* Rotation Y (gauche/droite) */}
        <div className="hud-item">
          <div className="hud-label">ROT Y</div>
          <div className="hud-bar-container">
            <div className="hud-bar-track">
              <div className="hud-bar-center" />
              <div
                className="hud-bar-fill"
                style={{
                  width: `${Math.abs(rotYNorm)}%`,
                  left: rotYNorm < 0 ? `${50 + rotYNorm}%` : "50%",
                  backgroundColor: rotYNorm < 0 ? "#ff4466" : "#44ff66",
                }}
              />
            </div>
            <div className="hud-value">{rotYNorm.toFixed(0)}</div>
          </div>
        </div>

        {/* Zoom */}
        <div className="hud-item">
          <div className="hud-label">ZOOM</div>
          <div className="hud-bar-container">
            <div className="hud-bar-track">
              <div className="hud-bar-center" />
              <div
                className="hud-bar-fill"
                style={{
                  width: `${Math.abs(zoomNorm)}%`,
                  left: zoomNorm < 0 ? `${50 + zoomNorm}%` : "50%",
                  backgroundColor: zoomNorm < 0 ? "#ff9944" : "#44aaff",
                }}
              />
            </div>
            <div className="hud-value">{zoomNorm.toFixed(0)}</div>
          </div>
        </div>

        {/* Explode */}
        <div className="hud-item">
          <div className="hud-label">EXPLODE</div>
          <div className="hud-bar-container">
            <div className="hud-bar-track-simple">
              <div
                className="hud-bar-fill-simple"
                style={{
                  width: `${explodePercent}%`,
                  backgroundColor: "#ff44ff",
                }}
              />
            </div>
            <div className="hud-value">{explodePercent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
