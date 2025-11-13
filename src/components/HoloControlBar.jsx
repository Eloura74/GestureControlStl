/**
 * HOLO-CONTROL BAR - Barre de contrôle holographique unifiée
 * Regroupe tous les contrôles dans une interface premium unique
 */

import React, { useState, useEffect } from "react";
import "./HoloControlBar.css";

export default function HoloControlBar() {
  const [wsStatus, setWsStatus] = useState("connecting");
  const [currentMode, setCurrentMode] = useState("IDLE");
  const [currentProfile, setCurrentProfile] = useState("balanced");
  const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });
  const [webcamVisible, setWebcamVisible] = useState(true);
  const [freezeMode, setFreezeMode] = useState(false);
  const [explodeMode, setExplodeMode] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const [sliceMode, setSliceMode] = useState(false);
  const [sliceAxis, setSliceAxis] = useState('X');

  const profiles = [
    { id: "precise", label: "🎯 Précis", color: "#00aaff" },
    { id: "balanced", label: "⚖️ Équilibré", color: "#00ff88" },
    { id: "reactive", label: "⚡ Réactif", color: "#ff9900" }
  ];

  // WebSocket status listener
  useEffect(() => {
    const handleWSStatus = (e) => {
      setWsStatus(e.detail.status);
    };
    window.addEventListener("holo:ws:status", handleWSStatus);
    return () => window.removeEventListener("holo:ws:status", handleWSStatus);
  }, []);

  // HUD listener pour mode
  useEffect(() => {
    const handleHUD = (e) => {
      setCurrentMode(e.detail.mode || "IDLE");
      setFreezeMode(e.detail.freeze || false);
      setExplodeMode((e.detail.explode || 0) > 0.5);
    };
    window.addEventListener("holo:hud", handleHUD);
    return () => window.removeEventListener("holo:hud", handleHUD);
  }, []);

  // Charger profil actuel
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.gesture_profile) {
          setCurrentProfile(data.gesture_profile);
        }
      })
      .catch(() => {});
  }, []);

  // Charger métriques
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:8765/api/metrics");
        const data = await res.json();
        setMetrics({
          fps: data.fps || 0,
          latency: data.latency_ms?.total || 0
        });
      } catch (e) {
        // Silent fail
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Changer profil
  const handleProfileChange = async (profileId) => {
    try {
      const response = await fetch(`/api/config/profile/${profileId}`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentProfile(data.profile);
        setIsProfileMenuOpen(false);
      }
    } catch (err) {
      console.error("❌ Erreur changement profil:", err);
    }
  };

  // Arrêter serveur
  const handleStop = async () => {
    if (!confirm("Voulez-vous vraiment arrêter le serveur ?")) return;
    try {
      await fetch("http://127.0.0.1:8765/api/shutdown", { method: "POST" });
      alert("✅ Serveur arrêté !");
    } catch (error) {
      alert("❌ Impossible d'arrêter le serveur.");
    }
  };

  // Toggle webcam
  const toggleWebcam = () => {
    setWebcamVisible(!webcamVisible);
    window.dispatchEvent(new CustomEvent("holo:webcam:toggle", { 
      detail: { visible: !webcamVisible } 
    }));
  };

  // Toggle laser mode
  const toggleLaser = () => {
    const newLaserState = !laserMode;
    setLaserMode(newLaserState);
    window.dispatchEvent(new CustomEvent("holo:laser:toggle", {
      detail: { enabled: newLaserState }
    }));
  };

  // Toggle slice mode
  const toggleSlice = () => {
    const newSliceState = !sliceMode;
    setSliceMode(newSliceState);
    window.dispatchEvent(new CustomEvent("holo:slice:toggle", {
      detail: { enabled: newSliceState }
    }));
  };

  // Cycle slice axis
  const cycleSliceAxis = () => {
    const axes = ['X', 'Y', 'Z'];
    const currentIndex = axes.indexOf(sliceAxis);
    const nextAxis = axes[(currentIndex + 1) % axes.length];
    setSliceAxis(nextAxis);
    window.dispatchEvent(new CustomEvent("holo:slice:axis", {
      detail: { axis: nextAxis }
    }));
  };

  // Status colors
  const wsColors = {
    connected: "#00ff00",
    connecting: "#ffff00",
    disconnected: "#ff0000",
    error: "#ff0000"
  };

  const modeColors = {
    IDLE: "#666",
    ROTATE: "#00ff88",
    ZOOM: "#00aaff",
    EXPLODE: "#ff6600",
    FREEZE: "#ffaa00"
  };

  const currentProfileData = profiles.find((p) => p.id === currentProfile);

  return (
    <div className="holo-control-bar">
      <div className="holo-bar-section holo-bar-left">
        {/* WebSocket Status */}
        <div className="holo-bar-item">
          <div 
            className="ws-status-indicator"
            style={{ 
              backgroundColor: wsColors[wsStatus],
              boxShadow: `0 0 10px ${wsColors[wsStatus]}`
            }}
          />
          <span className="holo-bar-label">
            {wsStatus === "connected" ? "ONLINE" : 
             wsStatus === "connecting" ? "CONNECTING..." : "OFFLINE"}
          </span>
        </div>

        {/* Mode FSM */}
        <div className="holo-bar-item">
          <div 
            className="mode-indicator"
            style={{ 
              color: modeColors[currentMode],
              textShadow: `0 0 10px ${modeColors[currentMode]}`
            }}
          >
            {currentMode}
          </div>
        </div>
      </div>

      <div className="holo-bar-section holo-bar-center">
        {/* Webcam Toggle */}
        <button 
          className={`holo-bar-btn ${webcamVisible ? 'active' : ''}`}
          onClick={toggleWebcam}
          title="Webcam Preview"
        >
          {webcamVisible ? "📹" : "📷"}
        </button>

        {/* Freeze Toggle (indicateur seulement, le freeze est géré par geste) */}
        <div 
          className={`holo-bar-btn ${freezeMode ? 'active freeze-active' : ''}`}
          title="Freeze Mode"
        >
          {freezeMode ? "❄️" : "🔓"}
        </div>

        {/* Profile Selector */}
        <div className="holo-profile-dropdown">
          <button
            className="holo-bar-btn profile-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{ borderColor: currentProfileData?.color }}
          >
            {currentProfileData?.label?.split(" ")[0]}
            <span className="profile-name-short">
              {currentProfile.toUpperCase().slice(0, 3)}
            </span>
          </button>

          {isProfileMenuOpen && (
            <div className="holo-profile-menu">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  className={`holo-profile-option ${currentProfile === profile.id ? "active" : ""}`}
                  onClick={() => handleProfileChange(profile.id)}
                  style={{ borderLeft: `3px solid ${profile.color}` }}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Explode Indicator */}
        <div 
          className={`holo-bar-btn ${explodeMode ? 'active explode-active' : ''}`}
          title="Explode Mode"
        >
          💥
        </div>

        {/* Laser Mode Toggle */}
        <button
          className={`holo-bar-btn ${laserMode ? 'active laser-active' : ''}`}
          onClick={toggleLaser}
          title="Touch-Laser Mode (Index pointé)"
        >
          🔫
        </button>

        {/* Slice Mode Toggle */}
        <button
          className={`holo-bar-btn ${sliceMode ? 'active slice-active' : ''}`}
          onClick={toggleSlice}
          title="Slice View Mode (Coupe dynamique)"
        >
          🔪
        </button>

        {/* Slice Axis (si actif) */}
        {sliceMode && (
          <button
            className="holo-bar-btn slice-axis-btn"
            onClick={cycleSliceAxis}
            title="Axe de coupe (clic pour changer)"
          >
            {sliceAxis}
          </button>
        )}
      </div>

      <div className="holo-bar-section holo-bar-right">
        {/* Metrics */}
        <div className="holo-bar-item metrics">
          <span className="metric-label">🎯</span>
          <span className="metric-value">{metrics.fps.toFixed(0)} FPS</span>
        </div>

        <div className="holo-bar-item metrics">
          <span className="metric-label">⚡</span>
          <span className="metric-value">{metrics.latency.toFixed(0)}ms</span>
        </div>

        {/* Stop Button */}
        <button 
          className="holo-bar-btn stop-btn"
          onClick={handleStop}
          title="Arrêter le serveur"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
          STOP
        </button>
      </div>
    </div>
  );
}
