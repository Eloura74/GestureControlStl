/**
 * UX CONFIGURATION - Holo-Control V3 Premium
 * Personnalisez l'interface sans modifier le code source
 */

export const UX_CONFIG = {
  // ============================================
  // HOLO-CONTROL BAR
  // ============================================
  holoBar: {
    enabled: true,
    position: "top", // "top" | "bottom"
    width: "85%", // "80%" | "90%" | "95%"
    opacity: 0.85, // 0.0 à 1.0
    blurAmount: "25px", // "15px" | "30px"
    
    // Couleurs
    colors: {
      primary: "rgba(0, 255, 200, 0.4)", // Cyan holographique
      background: "rgba(0, 10, 20, 0.85)",
      text: "#00ffcc",
      
      // Status WebSocket
      connected: "#00ff00",
      connecting: "#ffff00",
      disconnected: "#ff0000",
      
      // Modes FSM
      idle: "#666",
      rotate: "#00ff88",
      zoom: "#00aaff",
      explode: "#ff6600",
      freeze: "#ffaa00"
    },
    
    // Sections visibles
    sections: {
      wsStatus: true,
      modeIndicator: true,
      webcamToggle: true,
      freezeIndicator: true,
      profileSelector: true,
      explodeIndicator: true,
      metrics: true,
      stopButton: true
    }
  },

  // ============================================
  // GESTURE INDICATOR
  // ============================================
  gestureIndicator: {
    enabled: true,
    size: 120, // pixels
    autoHideDelay: 2000, // ms (2s)
    showForIdle: false, // Afficher même en IDLE ?
    
    // Animations
    animations: {
      appearDuration: 0.5, // secondes
      ringRotationSpeed: 2.0, // secondes par tour
      pulseSpeed: 1.5 // secondes par cycle
    },
    
    // Icônes personnalisables
    icons: {
      idle: "◌",
      rotate: "↻",
      zoom: "🔍",
      explode: "💥",
      freeze: "❄️"
    },
    
    // Labels personnalisables
    labels: {
      idle: "IDLE",
      rotate: "ROTATION",
      zoom: "ZOOM",
      explode: "EXPLOSION",
      freeze: "FREEZE"
    }
  },

  // ============================================
  // GHOST RETICULE
  // ============================================
  ghostReticule: {
    enabled: true,
    size: 80, // pixels
    showInIdle: false, // Masquer en IDLE
    
    // Style
    style: {
      opacity: 1.0,
      blurEffect: false, // Effet blur sur explode
      trailEffect: true, // Trail sur rotate
      particleEffect: true // Particules sur explode
    },
    
    // Position (si hand_pos non disponible)
    fallbackPosition: {
      x: 50, // % de l'écran
      y: 50
    },
    
    // Simulation mouvement (si hand_pos non disponible)
    simulateMovement: true,
    movementAmplitude: 5 // % d'écart depuis centre
  },

  // ============================================
  // SHADERS HOLOGRAPHIQUES
  // ============================================
  shaders: {
    // Effets activés/désactivés
    effects: {
      diffraction: true, // Arc-en-ciel
      electricArcs: true, // Lignes électriques
      spatialNoise: true, // Noise 3D
      edgeHighlights: true, // Arêtes brillantes
      glitch: true, // Glitch occasionnel
      wireframe: true, // Grille procedural
      scanlines: true, // Lignes horizontales
      verticalScan: true // Scan vertical IDLE
    },
    
    // Intensités
    intensity: {
      diffraction: 0.15, // 0.0 à 1.0
      electricArcs: 0.2,
      spatialNoise: 0.01,
      edgeHighlights: 0.6,
      wireframe: 0.5,
      scanlines: 0.7
    },
    
    // Glitch
    glitch: {
      probability: 0.02, // 2% chance par frame
      duration: 100, // ms
      amplitude: 0.02 // Décalage max
    },
    
    // Performance
    performance: {
      electricArcCount: 3, // Nombre de boucles (1-5)
      noiseOctaves: 1 // Octaves de noise (1-3)
    }
  },

  // ============================================
  // AUTO-FIT
  // ============================================
  autoFit: {
    enabled: true,
    marginMultiplier: 1.5, // Marge de sécurité (1.0 = serré, 2.0 = loin)
    centerModel: true, // Centrer à l'origine
    logToConsole: true // Debug logs
  },

  // ============================================
  // COMPOSANTS LEGACY
  // ============================================
  legacy: {
    gesturesHUD: true, // Afficher HUD détaillé
    webcamPiP: true, // Afficher aperçu webcam
    
    // Anciens composants (remplacés par HoloBar)
    stopButton: false,
    profileSelector: false,
    stateBadge: false
  },

  // ============================================
  // PERFORMANCE
  // ============================================
  performance: {
    // Bloom post-processing
    bloom: {
      enabled: true,
      strength: 0.15, // 0.0 à 1.0
      radius: 0.2,
      threshold: 0.95
    },
    
    // Effets de scène
    scene: {
      starsCount: 1000, // Nombre d'étoiles
      starsOpacity: 0.25,
      ringsCount: 3, // Anneaux holographiques
      ringsOpacity: 0.10,
      haloOpacity: 0.015
    },
    
    // Frame rate
    targetFPS: 30,
    adaptiveQuality: false // Réduire qualité si FPS < 20
  },

  // ============================================
  // ANIMATIONS
  // ============================================
  animations: {
    // Rotation automatique en IDLE
    idleRotation: {
      enabled: true,
      delay: 2.0, // secondes avant démarrage
      speed: 0.003 // rad/frame
    },
    
    // Flottement du modèle
    levitation: {
      enabled: true,
      amplitude: 0.05, // unités 3D
      speed: 1.5 // fréquence
    },
    
    // Anneaux rotatifs
    rings: {
      rotationSpeed: 0.2, // base speed
      pulsation: true
    }
  },

  // ============================================
  // RACCOURCIS CLAVIER
  // ============================================
  hotkeys: {
    resetCamera: "r",
    toggleExplode: "e",
    cycleProfile: "g",
    toggleHUD: "h", // Toggle GesturesHUD
    toggleWebcam: "w", // Toggle WebcamPiP
    screenshot: "s" // Capture d'écran (à implémenter)
  },

  // ============================================
  // DEBUG
  // ============================================
  debug: {
    enabled: false, // Mode debug général
    showFPS: true, // Compteur FPS
    showHandPosition: false, // Position main dans console
    logGestures: false, // Log chaque geste
    showBoundingBox: false, // Afficher bbox du modèle
    wireframeMode: false // Mode wireframe pur (pas holographique)
  }
};

// ============================================
// PRESETS RAPIDES
// ============================================

export const PRESETS = {
  // Preset minimaliste (performance max)
  minimal: {
    holoBar: { ...UX_CONFIG.holoBar, sections: { 
      wsStatus: true, 
      modeIndicator: true, 
      stopButton: true 
    }},
    gestureIndicator: { ...UX_CONFIG.gestureIndicator, size: 100 },
    ghostReticule: { ...UX_CONFIG.ghostReticule, enabled: false },
    shaders: { 
      effects: { 
        diffraction: false, 
        electricArcs: false, 
        spatialNoise: false 
      }
    },
    legacy: { gesturesHUD: false, webcamPiP: false },
    performance: {
      bloom: { enabled: false },
      scene: { starsCount: 500 }
    }
  },

  // Preset maximum (toutes fonctionnalités)
  maximum: {
    holoBar: UX_CONFIG.holoBar,
    gestureIndicator: { ...UX_CONFIG.gestureIndicator, size: 150 },
    ghostReticule: { ...UX_CONFIG.ghostReticule, showInIdle: true },
    shaders: { 
      effects: { ...UX_CONFIG.shaders.effects },
      performance: { electricArcCount: 5, noiseOctaves: 3 }
    },
    legacy: { gesturesHUD: true, webcamPiP: true },
    performance: {
      bloom: { enabled: true, strength: 0.25 },
      scene: { starsCount: 2000 }
    }
  },

  // Preset demo (spectaculaire pour présentation)
  demo: {
    holoBar: UX_CONFIG.holoBar,
    gestureIndicator: { ...UX_CONFIG.gestureIndicator, size: 140, autoHideDelay: 5000 },
    ghostReticule: { ...UX_CONFIG.ghostReticule, trailEffect: true, particleEffect: true },
    shaders: {
      effects: { ...UX_CONFIG.shaders.effects },
      intensity: {
        diffraction: 0.25,
        electricArcs: 0.3,
        edgeHighlights: 0.8
      }
    },
    performance: {
      bloom: { enabled: true, strength: 0.20, radius: 0.3 }
    },
    animations: {
      idleRotation: { enabled: true, speed: 0.005 }
    }
  }
};

// ============================================
// HELPER : Appliquer un preset
// ============================================

export function applyPreset(presetName) {
  if (PRESETS[presetName]) {
    Object.assign(UX_CONFIG, PRESETS[presetName]);
    console.log(`✅ Preset "${presetName}" appliqué`);
    return true;
  }
  console.error(`❌ Preset "${presetName}" introuvable`);
  return false;
}

// ============================================
// EXPORT
// ============================================

export default UX_CONFIG;
