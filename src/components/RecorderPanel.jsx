/**
 * RECORDER PANEL - Interface pour enregistrement et replay des gestes
 */

import React, { useState, useEffect } from "react";
import "./RecorderPanel.css";

export default function RecorderPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingFrames, setRecordingFrames] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [recordings, setRecordings] = useState([]);

  // Listeners pour events du recorder
  useEffect(() => {
    const handleRecorderStarted = () => setIsRecording(true);
    const handleRecorderStopped = (e) => {
      setIsRecording(false);
      setRecordingFrames(0);
      refreshRecordings();
    };
    
    const handlePlaybackStarted = () => setIsPlaying(true);
    const handlePlaybackStopped = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlaybackProgress(0);
    };
    const handlePlaybackPaused = () => setIsPaused(true);
    const handlePlaybackResumed = () => setIsPaused(false);
    
    const handleImported = () => refreshRecordings();

    window.addEventListener("recorder:started", handleRecorderStarted);
    window.addEventListener("recorder:stopped", handleRecorderStopped);
    window.addEventListener("recorder:playback:started", handlePlaybackStarted);
    window.addEventListener("recorder:playback:stopped", handlePlaybackStopped);
    window.addEventListener("recorder:playback:paused", handlePlaybackPaused);
    window.addEventListener("recorder:playback:resumed", handlePlaybackResumed);
    window.addEventListener("recorder:imported", handleImported);

    // Charger liste initiale
    refreshRecordings();

    return () => {
      window.removeEventListener("recorder:started", handleRecorderStarted);
      window.removeEventListener("recorder:stopped", handleRecorderStopped);
      window.removeEventListener("recorder:playback:started", handlePlaybackStarted);
      window.removeEventListener("recorder:playback:stopped", handlePlaybackStopped);
      window.removeEventListener("recorder:playback:paused", handlePlaybackPaused);
      window.removeEventListener("recorder:playback:resumed", handlePlaybackResumed);
      window.removeEventListener("recorder:imported", handleImported);
    };
  }, []);

  // Mettre à jour le nombre de frames pendant l'enregistrement
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent("recorder:get-state"));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  // Mettre à jour progress pendant playback
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    
    const interval = setInterval(() => {
      window.dispatchEvent(new CustomEvent("recorder:get-progress"));
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Listener pour state updates
  useEffect(() => {
    const handleStateUpdate = (e) => {
      if (e.detail) {
        setRecordingFrames(e.detail.recordingFrameCount || 0);
        setPlaybackProgress(e.detail.playbackProgress || 0);
      }
    };
    
    window.addEventListener("recorder:state-update", handleStateUpdate);
    return () => window.removeEventListener("recorder:state-update", handleStateUpdate);
  }, []);

  const refreshRecordings = () => {
    window.dispatchEvent(new CustomEvent("recorder:get-recordings"));
  };

  useEffect(() => {
    const handleRecordingsList = (e) => {
      if (e.detail && e.detail.recordings) {
        setRecordings(e.detail.recordings);
      }
    };
    
    window.addEventListener("recorder:recordings-list", handleRecordingsList);
    return () => window.removeEventListener("recorder:recordings-list", handleRecordingsList);
  }, []);

  const handleToggleRecording = () => {
    window.dispatchEvent(new CustomEvent("recorder:toggle-recording"));
  };

  const handleTogglePlayback = () => {
    window.dispatchEvent(new CustomEvent("recorder:toggle-playback"));
  };

  const handlePause = () => {
    window.dispatchEvent(new CustomEvent("recorder:pause"));
  };

  const handleStop = () => {
    window.dispatchEvent(new CustomEvent("recorder:stop"));
  };

  const handlePlayRecording = (id) => {
    window.dispatchEvent(new CustomEvent("recorder:play", { detail: { id } }));
  };

  const handleDeleteRecording = (id) => {
    if (confirm("Supprimer cet enregistrement ?")) {
      window.dispatchEvent(new CustomEvent("recorder:delete", { detail: { id } }));
      refreshRecordings();
    }
  };

  const handleExport = (id) => {
    window.dispatchEvent(new CustomEvent("recorder:export", { detail: { id } }));
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          window.dispatchEvent(new CustomEvent("recorder:import", {
            detail: { json: event.target.result }
          }));
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <>
      {/* Bouton toggle panel */}
      <button
        className={`recorder-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Gesture Recorder"
      >
        🎬
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="recorder-panel">
          <div className="recorder-header">
            <h3>🎬 Gesture Recorder</h3>
            <button className="recorder-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Contrôles */}
          <div className="recorder-controls">
            <button
              className={`recorder-btn record-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleToggleRecording}
              disabled={isPlaying}
            >
              {isRecording ? '⏹️ STOP REC' : '🔴 RECORD'}
            </button>

            <button
              className={`recorder-btn play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={handleTogglePlayback}
              disabled={isRecording}
            >
              {isPlaying ? '⏹️ STOP' : '▶️ PLAY'}
            </button>

            {isPlaying && (
              <button
                className="recorder-btn pause-btn"
                onClick={handlePause}
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
            )}
          </div>

          {/* Info recording */}
          {isRecording && (
            <div className="recorder-info">
              <span className="recording-indicator">🔴 REC</span>
              <span>{recordingFrames} frames</span>
            </div>
          )}

          {/* Progress playback */}
          {isPlaying && (
            <div className="recorder-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${playbackProgress * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {(playbackProgress * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Liste des enregistrements */}
          <div className="recordings-list">
            <div className="recordings-header">
              <h4>📚 Enregistrements ({recordings.length})</h4>
              <button 
                className="import-btn"
                onClick={handleImport}
                title="Importer JSON"
              >
                📥
              </button>
            </div>

            {recordings.length === 0 ? (
              <div className="no-recordings">
                Aucun enregistrement
              </div>
            ) : (
              <div className="recordings-items">
                {recordings.map((rec) => (
                  <div key={rec.id} className="recording-item">
                    <div className="recording-info">
                      <div className="recording-duration">
                        ⏱️ {rec.duration.toFixed(1)}s
                      </div>
                      <div className="recording-frames">
                        {rec.frameCount} frames
                      </div>
                      <div className="recording-date">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="recording-actions">
                      <button
                        onClick={() => handlePlayRecording(rec.id)}
                        title="Lire"
                        disabled={isRecording}
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => handleExport(rec.id)}
                        title="Exporter JSON"
                      >
                        💾
                      </button>
                      <button
                        onClick={() => handleDeleteRecording(rec.id)}
                        title="Supprimer"
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raccourcis clavier */}
          <div className="recorder-hotkeys">
            <small>
              <strong>N</strong> Record | <strong>P</strong> Play | 
              <strong> Space</strong> Pause | <strong>M</strong> Stop
            </small>
          </div>
        </div>
      )}
    </>
  );
}
