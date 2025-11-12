/**
 * Bouton d'Arrêt de l'Application - Arrête le serveur Python
 */
import React, { useState } from "react";
import "./StopButton.css";

export default function StopButton() {
  const [stopping, setStopping] = useState(false);

  const handleStop = async () => {
    if (!confirm("Voulez-vous vraiment arrêter le serveur ?")) {
      return;
    }

    setStopping(true);

    try {
      // Appeler l'API de shutdown du serveur Python
      const response = await fetch("http://127.0.0.1:8765/api/shutdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        alert("✅ Serveur Python arrêté !\n\nVous pouvez fermer l'onglet.");
      } else {
        throw new Error("Erreur lors de l'arrêt");
      }
    } catch (error) {
      alert("❌ Impossible d'arrêter le serveur.\n\nAppuyez sur CTRL+C dans le terminal.");
      setStopping(false);
    }
  };

  return (
    <button
      className="stop-button"
      onClick={handleStop}
      disabled={stopping}
      title="Arrêter le serveur Python"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
      <span>{stopping ? "ARRÊT..." : "STOP"}</span>
    </button>
  );
}
