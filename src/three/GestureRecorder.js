/**
 * GESTURE RECORDER - Système d'enregistrement et replay des gestes
 * Enregistre rotation, zoom, explosion, mode avec timestamps
 */

export class GestureRecorder {
  constructor() {
    this.isRecording = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.recording = [];
    this.startTime = 0;
    this.playbackStartTime = 0;
    this.currentPlaybackIndex = 0;
    this.recordings = []; // Historique des enregistrements
    this.maxRecordings = 10;
    
    console.log("🎬 GestureRecorder initialized");
  }

  /**
   * Démarre l'enregistrement
   */
  startRecording() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recording = [];
    this.startTime = Date.now();
    
    console.log("🔴 Recording started");
    
    // Event pour notifier l'UI
    window.dispatchEvent(new CustomEvent("recorder:started"));
  }

  /**
   * Arrête l'enregistrement
   */
  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log(`⏹️ Recording stopped - ${this.recording.length} frames, ${duration.toFixed(1)}s`);
    
    // Sauvegarder dans l'historique
    if (this.recording.length > 0) {
      const recordingData = {
        id: `rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        duration: duration,
        frameCount: this.recording.length,
        frames: [...this.recording]
      };
      
      this.recordings.unshift(recordingData);
      
      // Limiter le nombre d'enregistrements
      if (this.recordings.length > this.maxRecordings) {
        this.recordings.pop();
      }
      
      // Sauvegarder dans localStorage
      this.saveToLocalStorage();
    }
    
    window.dispatchEvent(new CustomEvent("recorder:stopped", {
      detail: { frameCount: this.recording.length, duration }
    }));
    
    return this.recording;
  }

  /**
   * Enregistre une frame
   */
  recordFrame(gestureData) {
    if (!this.isRecording) return;
    
    const timestamp = Date.now() - this.startTime;
    
    this.recording.push({
      t: timestamp, // Timestamp relatif (ms)
      r: { // Rotation
        x: gestureData.rotX || 0,
        y: gestureData.rotY || 0
      },
      z: gestureData.zoom || 0, // Zoom delta
      e: gestureData.explode || 0, // Explosion factor
      m: gestureData.mode || 'IDLE', // Mode FSM
      f: gestureData.freeze || false // Freeze
    });
  }

  /**
   * Démarre le replay d'un enregistrement
   */
  startPlayback(recordingId = null) {
    if (this.isPlaying) return;
    
    // Si ID fourni, charger cet enregistrement
    let recordingToPlay = null;
    if (recordingId) {
      recordingToPlay = this.recordings.find(r => r.id === recordingId);
    } else {
      // Sinon, utiliser le dernier enregistrement
      recordingToPlay = this.recording.length > 0 
        ? { frames: this.recording }
        : this.recordings[0];
    }
    
    if (!recordingToPlay || !recordingToPlay.frames || recordingToPlay.frames.length === 0) {
      console.warn("⚠️ No recording to play");
      return false;
    }
    
    this.isPlaying = true;
    this.isPaused = false;
    this.currentPlaybackIndex = 0;
    this.playbackStartTime = Date.now();
    this.playbackFrames = recordingToPlay.frames;
    
    console.log(`▶️ Playback started - ${this.playbackFrames.length} frames`);
    
    window.dispatchEvent(new CustomEvent("recorder:playback:started"));
    
    return true;
  }

  /**
   * Arrête le replay
   */
  stopPlayback() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPlaybackIndex = 0;
    
    console.log("⏹️ Playback stopped");
    
    window.dispatchEvent(new CustomEvent("recorder:playback:stopped"));
  }

  /**
   * Pause/resume le replay
   */
  togglePause() {
    if (!this.isPlaying) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      console.log("⏸️ Playback paused");
      window.dispatchEvent(new CustomEvent("recorder:playback:paused"));
    } else {
      // Ajuster le temps de départ
      this.playbackStartTime = Date.now() - this.playbackFrames[this.currentPlaybackIndex].t;
      console.log("▶️ Playback resumed");
      window.dispatchEvent(new CustomEvent("recorder:playback:resumed"));
    }
  }

  /**
   * Obtient la frame actuelle du replay
   */
  getPlaybackFrame() {
    if (!this.isPlaying || this.isPaused || !this.playbackFrames) {
      return null;
    }
    
    const elapsed = Date.now() - this.playbackStartTime;
    
    // Trouver la frame correspondant au timestamp actuel
    while (
      this.currentPlaybackIndex < this.playbackFrames.length &&
      this.playbackFrames[this.currentPlaybackIndex].t <= elapsed
    ) {
      this.currentPlaybackIndex++;
    }
    
    // Si on a atteint la fin
    if (this.currentPlaybackIndex >= this.playbackFrames.length) {
      console.log("✅ Playback finished");
      this.stopPlayback();
      return null;
    }
    
    // Retourner la frame actuelle
    const frame = this.playbackFrames[this.currentPlaybackIndex - 1] || this.playbackFrames[0];
    
    return {
      rotX: frame.r.x,
      rotY: frame.r.y,
      zoom: frame.z,
      explode: frame.e,
      mode: frame.m,
      freeze: frame.f,
      progress: this.currentPlaybackIndex / this.playbackFrames.length
    };
  }

  /**
   * Exporte l'enregistrement en JSON
   */
  exportToJSON(recordingId = null) {
    let recording = null;
    
    if (recordingId) {
      recording = this.recordings.find(r => r.id === recordingId);
    } else {
      recording = this.recordings[0];
    }
    
    if (!recording) {
      console.warn("⚠️ No recording to export");
      return null;
    }
    
    const json = JSON.stringify(recording, null, 2);
    
    // Télécharger le fichier
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-recording-${recording.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`💾 Recording exported: ${recording.id}`);
    
    return json;
  }

  /**
   * Importe un enregistrement depuis JSON
   */
  importFromJSON(jsonString) {
    try {
      const recording = JSON.parse(jsonString);
      
      if (!recording.frames || !Array.isArray(recording.frames)) {
        throw new Error("Invalid recording format");
      }
      
      // Ajouter à l'historique
      recording.id = `imported_${Date.now()}`;
      this.recordings.unshift(recording);
      
      if (this.recordings.length > this.maxRecordings) {
        this.recordings.pop();
      }
      
      this.saveToLocalStorage();
      
      console.log(`📥 Recording imported: ${recording.frameCount} frames`);
      
      window.dispatchEvent(new CustomEvent("recorder:imported", {
        detail: { id: recording.id }
      }));
      
      return recording.id;
    } catch (err) {
      console.error("❌ Import failed:", err);
      return null;
    }
  }

  /**
   * Sauvegarde dans localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('holo-recordings', JSON.stringify(this.recordings));
    } catch (err) {
      console.warn("⚠️ localStorage save failed:", err);
    }
  }

  /**
   * Charge depuis localStorage
   */
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('holo-recordings');
      if (data) {
        this.recordings = JSON.parse(data);
        console.log(`📂 Loaded ${this.recordings.length} recordings from storage`);
      }
    } catch (err) {
      console.warn("⚠️ localStorage load failed:", err);
    }
  }

  /**
   * Supprime un enregistrement
   */
  deleteRecording(recordingId) {
    const index = this.recordings.findIndex(r => r.id === recordingId);
    if (index !== -1) {
      this.recordings.splice(index, 1);
      this.saveToLocalStorage();
      console.log(`🗑️ Recording deleted: ${recordingId}`);
      return true;
    }
    return false;
  }

  /**
   * Obtient la liste des enregistrements
   */
  getRecordings() {
    return this.recordings.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      duration: r.duration,
      frameCount: r.frameCount
    }));
  }

  /**
   * Obtient l'état actuel
   */
  getState() {
    return {
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      recordingFrameCount: this.recording.length,
      playbackProgress: this.isPlaying 
        ? this.currentPlaybackIndex / (this.playbackFrames?.length || 1)
        : 0,
      recordingsCount: this.recordings.length
    };
  }

  /**
   * Nettoyage
   */
  dispose() {
    this.stopRecording();
    this.stopPlayback();
    console.log("🎬 GestureRecorder disposed");
  }
}

/**
 * Contrôleur UI pour le recorder
 */
export class RecorderUIController {
  constructor(recorder) {
    this.recorder = recorder;
    
    // Charger les enregistrements sauvegardés
    this.recorder.loadFromLocalStorage();
  }

  /**
   * Toggle recording
   */
  toggleRecording() {
    if (this.recorder.isRecording) {
      this.recorder.stopRecording();
      return false;
    } else {
      this.recorder.startRecording();
      return true;
    }
  }

  /**
   * Toggle playback
   */
  togglePlayback() {
    if (this.recorder.isPlaying) {
      this.recorder.stopPlayback();
      return false;
    } else {
      return this.recorder.startPlayback();
    }
  }

  /**
   * Raccourcis clavier
   */
  setupHotkeys() {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'n': // Record
          this.toggleRecording();
          break;
        case 'l': // Lecture (Play) - Changé de P à L pour éviter conflit Performance Monitor
          this.togglePlayback();
          break;
        case 'space': // Pause (si en playback)
          if (this.recorder.isPlaying) {
            this.recorder.togglePause();
            e.preventDefault();
          }
          break;
        case 'k': // Stop (changé de M à K car M = menu modèles)
          if (this.recorder.isRecording) {
            this.recorder.stopRecording();
          } else if (this.recorder.isPlaying) {
            this.recorder.stopPlayback();
          }
          break;
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    
    return () => window.removeEventListener('keypress', handleKeyPress);
  }
}
