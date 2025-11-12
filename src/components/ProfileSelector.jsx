/**
 * Sélecteur de profils de gestes
 * Permet de basculer entre Précis / Équilibré / Réactif
 */

import React, { useState, useEffect } from "react";
import "./ProfileSelector.css";

export default function ProfileSelector() {
  const [currentProfile, setCurrentProfile] = useState("balanced");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const profiles = [
    {
      id: "precise",
      label: "🎯 Précis",
      description: "Mouvements fins, très stable",
      color: "#00aaff"
    },
    {
      id: "balanced",
      label: "⚖️  Équilibré",
      description: "Recommandé pour un usage normal",
      color: "#00ff88"
    },
    {
      id: "reactive",
      label: "⚡ Réactif",
      description: "Réponse immédiate, moins stable",
      color: "#ff9900"
    }
  ];

  // Charger le profil actuel depuis l'API
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.gesture_profile) {
          setCurrentProfile(data.gesture_profile);
        }
      })
      .catch((err) => console.error("❌ Erreur chargement profil:", err));
  }, []);

  const handleProfileChange = async (profileId) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/config/profile/${profileId}`, {
        method: "POST"
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProfile(data.profile);
        console.log(`✅ Profil changé: ${data.profile}`);

        // Notification visuelle
        const notification = document.createElement("div");
        notification.className = "profile-notification";
        notification.textContent = `Profil: ${profiles.find(p => p.id === profileId)?.label}`;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 2000);
      } else {
        console.error("❌ Erreur changement profil");
      }
    } catch (err) {
      console.error("❌ Erreur réseau:", err);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const currentProfileData = profiles.find((p) => p.id === currentProfile);

  // Raccourci clavier 'G' pour cycler les profils
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key.toLowerCase() === "g") {
        const currentIndex = profiles.findIndex((p) => p.id === currentProfile);
        const nextIndex = (currentIndex + 1) % profiles.length;
        handleProfileChange(profiles[nextIndex].id);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [currentProfile]);

  return (
    <div className="profile-selector">
      <button
        className="profile-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: currentProfileData?.color }}
      >
        <span className="profile-icon">{currentProfileData?.label?.split(" ")[0]}</span>
        <span className="profile-name">{currentProfileData?.id.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            <h3>Profils de Gestes</h3>
            <p className="profile-hint">Appuyez sur 'G' pour cycler</p>
          </div>

          {profiles.map((profile) => (
            <button
              key={profile.id}
              className={`profile-option ${currentProfile === profile.id ? "active" : ""}`}
              onClick={() => handleProfileChange(profile.id)}
              disabled={loading}
              style={{
                borderColor: currentProfile === profile.id ? profile.color : "transparent"
              }}
            >
              <div className="profile-option-label">
                {profile.label}
              </div>
              <div className="profile-option-desc">
                {profile.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
