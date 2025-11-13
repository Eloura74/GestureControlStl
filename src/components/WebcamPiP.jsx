import React, { useEffect, useState, useRef } from "react";
import "./WebcamPiP.css";

export default function WebcamPiP() {
  const [visible, setVisible] = useState(true);
  const [preview, setPreview] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail.preview) {
        setPreview(`data:image/jpeg;base64,${e.detail.preview}`);
      }
    };
    window.addEventListener("holo:hud", handler);
    return () => window.removeEventListener("holo:hud", handler);
  }, []);

  // Écouter les événements de toggle depuis HoloControlBar
  useEffect(() => {
    const toggleHandler = (e) => {
      setVisible(e.detail.visible);
    };
    window.addEventListener("holo:webcam:toggle", toggleHandler);
    return () => window.removeEventListener("holo:webcam:toggle", toggleHandler);
  }, []);

  const toggleVisible = () => {
    setVisible((prev) => !prev);
  };

  return (
    <div className="pip-container">
      <button
        className="pip-toggle"
        onClick={toggleVisible}
        title={visible ? "Masquer webcam" : "Afficher webcam"}
      >
        {visible ? "📹" : "📷"}
      </button>

      {visible && preview && (
        <div className="pip-window">
          <div className="pip-header">
            <span className="pip-title">WEBCAM</span>
            <button
              className="pip-close"
              onClick={() => setVisible(false)}
              title="Fermer"
            >
              ✕
            </button>
          </div>
          <img
            ref={imgRef}
            src={preview}
            alt="Webcam preview"
            className="pip-image"
          />
          <div className="pip-overlay">LIVE</div>
        </div>
      )}
    </div>
  );
}
