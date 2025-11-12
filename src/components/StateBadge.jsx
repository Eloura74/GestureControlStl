/**
 * Badge d'état - Affiche le mode FSM actuel et le statut WS
 */

import React from "react";
import "./StateBadge.css";

export default function StateBadge({ mode, wsStatus }) {
  const modeLabels = {
    IDLE: { label: "Idle", color: "#666" },
    ROTATE: { label: "🔄 Rotation", color: "#00ff88" },
    ZOOM: { label: "🔍 Zoom", color: "#00aaff" },
    EXPLODE: { label: "💥 Explosion", color: "#ff6600" },
    FREEZE: { label: "❄️  Freeze", color: "#ffaa00" }
  };

  const wsLabels = {
    connecting: { label: "⏳ Connexion...", color: "#ff9900" },
    connected: { label: "✅ Connecté", color: "#00ff88" },
    disconnected: { label: "❌ Déconnecté", color: "#ff3333" },
    error: { label: "⚠️  Erreur", color: "#ff3333" }
  };

  const modeInfo = modeLabels[mode] || modeLabels.IDLE;
  const wsInfo = wsLabels[wsStatus] || wsLabels.connecting;

  return (
    <div className="state-badge">
      <div className="state-mode" style={{ borderColor: modeInfo.color }}>
        <span className="mode-label">{modeInfo.label}</span>
      </div>
      <div className="state-ws" style={{ color: wsInfo.color }}>
        <span className="ws-label">{wsInfo.label}</span>
      </div>
    </div>
  );
}
