/**
 * MODEL GALLERY - Interface galerie de modèles STL
 */

import React, { useState, useEffect } from "react";
import "./ModelGallery.css";

export default function ModelGallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Charger la liste des modèles
  useEffect(() => {
    const handleModelsList = (e) => {
      if (e.detail && e.detail.models) {
        setModels(e.detail.models);
        const current = e.detail.models.find(m => m.isCurrent);
        if (current) {
          setCurrentIndex(current.index);
        }
      }
    };

    const handleSwitched = (e) => {
      if (e.detail) {
        setCurrentIndex(e.detail.index);
        refreshModels();
      }
    };

    const handleLoaded = () => {
      refreshModels();
    };

    window.addEventListener("multiSTL:models-list", handleModelsList);
    window.addEventListener("multiSTL:switched", handleSwitched);
    window.addEventListener("multiSTL:loaded", handleLoaded);

    // Charger liste initiale
    refreshModels();

    return () => {
      window.removeEventListener("multiSTL:models-list", handleModelsList);
      window.removeEventListener("multiSTL:switched", handleSwitched);
      window.removeEventListener("multiSTL:loaded", handleLoaded);
    };
  }, []);

  const refreshModels = () => {
    window.dispatchEvent(new CustomEvent("multiSTL:get-list"));
  };

  const handleSelectModel = (index) => {
    window.dispatchEvent(new CustomEvent("multiSTL:switch", {
      detail: { index }
    }));
  };

  const handleNext = () => {
    window.dispatchEvent(new CustomEvent("multiSTL:next"));
  };

  const handlePrevious = () => {
    window.dispatchEvent(new CustomEvent("multiSTL:previous"));
  };

  const currentModel = models.find(m => m.index === currentIndex);

  return (
    <>
      {/* Bouton toggle */}
      <button
        className={`gallery-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Model Gallery"
      >
        📦
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="gallery-panel">
          <div className="gallery-header">
            <h3>📦 Model Gallery</h3>
            <button className="gallery-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Modèle actuel */}
          {currentModel && (
            <div className="current-model">
              <div className="current-model-info">
                <span className="model-icon">🎯</span>
                <div>
                  <div className="model-name">{currentModel.name}</div>
                  <div className="model-index">
                    {currentIndex + 1} / {models.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contrôles navigation */}
          <div className="gallery-controls">
            <button
              className="gallery-nav-btn"
              onClick={handlePrevious}
              disabled={models.length <= 1}
            >
              ◀
            </button>
            <button
              className="gallery-nav-btn"
              onClick={handleNext}
              disabled={models.length <= 1}
            >
              ▶
            </button>
          </div>

          {/* Liste des modèles */}
          <div className="models-list">
            {models.length === 0 ? (
              <div className="no-models">
                Aucun modèle chargé
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model.id}
                  className={`model-item ${model.isCurrent ? 'current' : ''}`}
                  onClick={() => handleSelectModel(model.index)}
                >
                  <span className="model-item-icon">
                    {model.loaded ? '✅' : '⏳'}
                  </span>
                  <span className="model-item-name">{model.name}</span>
                  {model.isCurrent && (
                    <span className="current-badge">●</span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Hotkeys */}
          <div className="gallery-hotkeys">
            <small>
              <strong>← →</strong> ou <strong>A D</strong> pour naviguer
            </small>
          </div>
        </div>
      )}
    </>
  );
}
