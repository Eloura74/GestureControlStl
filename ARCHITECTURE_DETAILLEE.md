# 🏗️ ARCHITECTURE DÉTAILLÉE - HOLO-CONTROL V3

> Spécifications techniques approfondies du système

---

## 📐 DIAGRAMMES D'ARCHITECTURE

### Architecture système complète

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Application (Vite)                    │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │ AppV3       │  │ Components  │  │  Three.js   │     │  │
│  │  │ Premium     │◄─┤   UI/UX     │  │   Modules   │     │  │
│  │  └─────┬───────┘  └─────────────┘  └──────┬──────┘     │  │
│  │        │                                    │            │  │
│  │        │         WebSocket Client          │            │  │
│  │        └────────────────┬──────────────────┘            │  │
│  │                         │                                │  │
│  └─────────────────────────┼────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ WS (JSON Protocol v2)
                              │ ws://localhost:8765/ws
┌─────────────────────────────┼────────────────────────────────────┐
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            FastAPI Server (Python 3.11+)                │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ WebSocket    │  │   Camera     │  │   Gesture    │ │   │
│  │  │   Manager    │◄─┤     Loop     │◄─┤  Processor   │ │   │
│  │  └──────────────┘  └──────┬───────┘  └──────┬───────┘ │   │
│  │                            │                  │         │   │
│  │                    ┌───────▼──────┐  ┌────────▼─────┐  │   │
│  │                    │   OpenCV     │  │     FSM      │  │   │
│  │                    │  VideoCapture│  │ State Machine│  │   │
│  │                    └───────┬──────┘  └────────┬─────┘  │   │
│  │                            │                  │         │   │
│  │                    ┌───────▼──────────────────▼─────┐  │   │
│  │                    │      MediaPipe Hands           │  │   │
│  │                    │  (Hand Tracking + Landmarks)   │  │   │
│  │                    └────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           BACKEND SERVER                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Webcam   │
                        └──────────┘
```

---

## 🔄 DIAGRAMME DE SÉQUENCE - Session complète

```
User        Browser      WebSocket     FastAPI      MediaPipe    Camera
 │             │             │             │             │          │
 │ 1. Ouvre    │             │             │             │          │
 ├────────────►│             │             │             │          │
 │             │             │             │             │          │
 │             │ 2. Connect  │             │             │          │
 │             ├────────────►│             │             │          │
 │             │             │ 3. Register │             │          │
 │             │             ├────────────►│             │          │
 │             │             │             │ 4. Start    │          │
 │             │             │             │    Loop     │          │
 │             │             │             ├────────────►│          │
 │             │             │             │             │ 5. Open  │
 │             │             │             │             ├─────────►│
 │             │             │             │             │          │
 │             │◄────────────┤◄────────────┤◄────────────┤◄─────────┤
 │             │    6. Connected (status)  │             │          │
 │             │             │             │             │          │
 │ 7. Fait     │             │             │             │          │
 │   geste     │             │             │             │          │
 │ 🖐️          │             │             │             │ 8. Frame │
 │             │             │             │             │◄─────────┤
 │             │             │             │ 9. Detect   │          │
 │             │             │             ├────────────►│          │
 │             │             │             │ Landmarks   │          │
 │             │             │             │◄────────────┤          │
 │             │             │ 10. Process │             │          │
 │             │             │◄────────────┤             │          │
 │             │ 11. WS Msg  │             │             │          │
 │             │◄────────────┤             │             │          │
 │ 12. Visual  │             │             │             │          │
 │   Update    │             │             │             │          │
 │◄────────────┤             │             │             │          │
 │             │             │             │             │          │
 │             │     (Loop 60 FPS)         │             │          │
 │             │◄────────────────────────► │             │          │
```

---

## 🧩 MODULES DÉTAILLÉS

### Backend - GestureProcessor

```python
class GestureProcessor:
    """
    Processeur principal des gestes de la main
    
    Attributes:
        config: ConfigManager - Configuration globale
        kalman_enabled: bool - Activer filtre Kalman
        kf_wrist: KalmanFilter2D - Filtre poignet
        adaptive_dz_rot: AdaptiveDeadzone - Zone morte rotation
        adaptive_dz_zoom: AdaptiveDeadzone - Zone morte zoom
        fsm: GestureFSM - Machine à états
        prev_wrist: ndarray - Position poignet précédente
        rot_vel: ndarray - Vitesse rotation [dx, dy]
        moving_avg_dist: float - Distance moyenne mobile (zoom)
        explode_factor: float - Facteur explosion [0-1]
        last_log_time: float - Timestamp dernier log
    """
    
    def __init__(self, config: ConfigManager):
        # Configuration
        self.cfg = config
        gestures_cfg = config.get('gestures', default={})
        
        # Kalman Filter pour lissage
        self.kalman_enabled = gestures_cfg.get('kalman_enabled', True)
        if self.kalman_enabled:
            self.kf_wrist = KalmanFilter2D(
                process_variance=1e-5,
                measurement_variance=1e-4
            )
        
        # Deadzones adaptatives
        self.adaptive_dz_rot = AdaptiveDeadzone(
            base_deadzone=0.001,
            scale_factor=10.0
        )
        self.adaptive_dz_zoom = AdaptiveDeadzone(
            base_deadzone=gestures_cfg.get('zoom_deadzone', 0.002),
            scale_factor=50.0
        )
        
        # FSM (Machine à états)
        dwell_times = {
            GestureMode.ROTATE: self.cfg.fsm.get('dwell_rotate', 80),
            GestureMode.ZOOM: self.cfg.fsm.get('dwell_zoom', 80),
            GestureMode.EXPLODE: self.cfg.fsm.get('dwell_explode', 100),
            GestureMode.IDLE: self.cfg.fsm.get('dwell_idle', 120),
            GestureMode.FREEZE: 0
        }
        self.fsm = GestureFSM(dwell_ms=dwell_times)
        
        # État interne
        self.prev_wrist = None
        self.rot_vel = np.array([0.0, 0.0], dtype=np.float32)
        self.moving_avg_dist = None
        self.explode_factor = 0.0
        self.last_log_time = 0.0
    
    def process_frame(self, hands_landmarks: list) -> dict:
        """
        Traite une frame avec landmarks détectés
        
        Pipeline:
        1. Analyse gestes élémentaires (poing, ouvert, pincement)
        2. Mise à jour FSM (détermine mode actuel)
        3. Calcul rotation si mode ROTATE
        4. Calcul zoom si mode ZOOM
        5. Calcul explosion si mode EXPLODE
        6. Application filtres et lissages
        7. Retour dict avec deltas
        
        Args:
            hands_landmarks: Liste de landmarks MediaPipe (0-2 mains)
            
        Returns:
            {
                "rot_dx": float,
                "rot_dy": float,
                "zoom_delta": float,
                "explode": float [0-1],
                "mode": str,
                "freeze": bool,
                "measure": dict (désactivé)
            }
        """
        # ... (voir code complet dans server_v3.py)
    
    def is_fist_closed(self, landmarks) -> bool:
        """
        Détecte poing fermé
        
        Critères:
        - Pouce replié (tip.x proche base.x)
        - ≤1 doigt levé (tip.y >= pip.y)
        
        Args:
            landmarks: Liste 21 landmarks d'une main
            
        Returns:
            True si poing fermé
        """
        # Vérif pouce
        thumb_tip = landmarks[4]
        thumb_base = landmarks[2]
        thumb_folded = abs(thumb_tip.x - thumb_base.x) < 0.1
        
        # Compte doigts levés
        pairs = [(8,6), (12,10), (16,14), (20,18)]
        extended = sum(landmarks[tip].y < landmarks[pip].y 
                      for tip, pip in pairs)
        
        return thumb_folded and extended <= 1
    
    def is_hand_open(self, landmarks) -> bool:
        """
        Détecte main ouverte
        
        Critères:
        - ≥3 doigts levés (tip.y < pip.y)
        
        Returns:
            True si main ouverte
        """
        pairs = [(8,6), (12,10), (16,14), (20,18)]
        extended = sum(landmarks[tip].y < landmarks[pip].y 
                      for tip, pip in pairs)
        return extended >= 3
    
    def is_pinching(self, landmarks, threshold=0.08) -> tuple:
        """
        Détecte pincement pouce-index
        
        Args:
            landmarks: Landmarks main
            threshold: Distance max pour pincement
            
        Returns:
            (is_pinching: bool, distance: float)
        """
        thumb_tip = np.array([landmarks[4].x, landmarks[4].y])
        index_tip = np.array([landmarks[8].x, landmarks[8].y])
        dist = np.linalg.norm(thumb_tip - index_tip)
        return (dist < threshold, dist)
```

---

### Backend - GestureFSM

```python
class GestureFSM:
    """
    Machine à états finis pour gestion modes gestuels
    
    Diagramme transitions:
    
          ┌──────► IDLE ◄──────┐
          │         │ ▲         │
          │         ▼ │         │
    ┌─────┴─►  ROTATE │         │
    │            │ ▲  │         │
    │            ▼ │  │         │
    │         ZOOM   │          │
    │            │ ▲ │          │
    │            ▼ │ │          │
    └───────► EXPLODE │         │
                 │ ▲  │         │
                 ▼ │  │         │
               FREEZE │         │
                 └────┴─────────┘
    
    Règles:
    - FREEZE a priorité absolue (poing)
    - Dwell time avant chaque transition
    - Transitions unidirectionnelles sauf FREEZE→n'importe
    """
    
    def __init__(self, dwell_ms: dict = None):
        self.mode = GestureMode.IDLE
        self.time_entered = time.time()
        self.previous_mode = GestureMode.IDLE
        self.dwell_times = dwell_ms or {...}
        self.transitions = 0
        self.mode_durations = {mode: 0.0 for mode in GestureMode}
    
    def update(self, hands_detected, is_fist, is_pinch_left, 
               is_pinch_right, is_index_up, is_measure=False) -> GestureMode:
        """
        Met à jour FSM selon gestes détectés
        
        Ordre priorité (décroissant):
        1. FREEZE (poing) - immédiat
        2. ZOOM (2 pincements)
        3. EXPLODE (2 mains écartées, pas pincement, pas mesure)
        4. ROTATE (1 main)
        5. IDLE (défaut)
        
        Returns:
            Mode actuel après mise à jour
        """
        # Check priorité 1: FREEZE
        if is_fist:
            if self._can_transition(GestureMode.FREEZE):
                self._enter_mode(GestureMode.FREEZE)
            return self.mode
        
        # Check priorité 2: ZOOM
        if hands_detected >= 2 and is_pinch_left and is_pinch_right:
            if self._can_transition(GestureMode.ZOOM):
                self._enter_mode(GestureMode.ZOOM)
            return self.mode
        
        # Check priorité 3: EXPLODE
        if hands_detected >= 2 and not (is_pinch_left or is_pinch_right) and not is_measure:
            if self._can_transition(GestureMode.EXPLODE):
                self._enter_mode(GestureMode.EXPLODE)
            return self.mode
        
        # Check priorité 4: ROTATE
        if hands_detected == 1:
            if self._can_transition(GestureMode.ROTATE):
                self._enter_mode(GestureMode.ROTATE)
            return self.mode
        
        # Défaut: IDLE
        if self._can_transition(GestureMode.IDLE):
            self._enter_mode(GestureMode.IDLE)
        return self.mode
    
    def _can_transition(self, target_mode: GestureMode) -> bool:
        """Vérifie si transition autorisée (dwell time)"""
        if target_mode == self.mode:
            return False
        
        if target_mode == GestureMode.FREEZE:
            return True  # Freeze immédiat
        
        dwell_required = self.dwell_times.get(target_mode, 0)
        time_in_mode = (time.time() - self.time_entered) * 1000  # ms
        return time_in_mode >= dwell_required
```

---

### Frontend - MultiSTLManager

```javascript
/**
 * Gestionnaire multi-modèles 3D (STL + OBJ)
 * 
 * Fonctionnalités:
 * - Chargement asynchrone modèles
 * - Gestion matériaux holographiques
 * - Auto-fit intelligent (bbox)
 * - Explosion radiale (OBJ multi-meshes)
 * - Switch instantané entre modèles
 */
class MultiSTLManager {
  constructor(scene, materialRef) {
    this.scene = scene;
    this.materialRef = materialRef;
    this.models = [];           // [{name, path, type, loaded, group, meshes}]
    this.currentModelName = null;
    this.root = new THREE.Group();
    this.scene.add(this.root);
  }
  
  /**
   * Ajoute modèle à la liste (ne charge pas encore)
   */
  addModel(name, path, type) {
    if (!['stl', 'obj'].includes(type)) {
      throw new Error(`Type invalide: ${type}`);
    }
    
    this.models.push({
      name,
      path,
      type,
      loaded: false,
      group: null,
      meshes: []
    });
  }
  
  /**
   * Charge tous les modèles en parallèle
   * 
   * Returns:
   *   Promise qui résout quand tous chargés
   */
  async loadAllModels() {
    const promises = this.models.map(model => this.loadModel(model));
    await Promise.all(promises);
    console.log('✅ Tous modèles chargés');
  }
  
  /**
   * Charge un modèle spécifique
   * 
   * Pipeline:
   * 1. Chargement fichier (STLLoader / OBJLoader)
   * 2. Centrage bbox
   * 3. Auto-scale pour fit viewport
   * 4. Application matériau holographique
   * 5. Calcul données explosion (OBJ uniquement)
   * 6. Ajout à scene (caché)
   */
  async loadModel(modelInfo) {
    try {
      if (modelInfo.type === 'stl') {
        await this._loadSTL(modelInfo);
      } else if (modelInfo.type === 'obj') {
        await this._loadOBJ(modelInfo);
      }
      modelInfo.loaded = true;
    } catch (error) {
      console.error(`❌ Erreur chargement ${modelInfo.name}:`, error);
    }
  }
  
  /**
   * Change modèle visible
   */
  switchToModel(name) {
    const model = this.models.find(m => m.name === name);
    if (!model || !model.loaded) return;
    
    // Cache tous
    this.models.forEach(m => {
      if (m.group) m.group.visible = false;
    });
    
    // Affiche sélectionné
    model.group.visible = true;
    this.currentModelName = name;
    
    // Émet event
    window.dispatchEvent(new CustomEvent('multiSTL:switched', {
      detail: { name, model }
    }));
  }
  
  /**
   * Applique explosion radiale
   * 
   * @param {number} factor - Facteur [0-1]
   * 
   * Algorithme:
   * Pour chaque mesh:
   *   position = initialPos + explosionDir * factor * 3.0
   */
  applyExplosion(factor) {
    factor = Math.max(0, Math.min(1, factor));
    
    const currentModel = this.models.find(m => m.name === this.currentModelName);
    if (!currentModel) return;
    
    // OBJ seulement (multi-meshes)
    if (currentModel.type !== 'obj') return;
    
    currentModel.meshes.forEach(mesh => {
      if (!mesh.userData.initialPos) return;
      
      const { initialPos, explosionDir } = mesh.userData;
      const offset = explosionDir.clone().multiplyScalar(factor * 3.0);
      mesh.position.copy(initialPos).add(offset);
    });
  }
  
  /**
   * Charge fichier STL
   */
  async _loadSTL(modelInfo) {
    return new Promise((resolve, reject) => {
      const loader = new STLLoader();
      loader.load(
        modelInfo.path,
        (geometry) => {
          const mesh = new THREE.Mesh(geometry, this.materialRef.current);
          
          // Auto-fit
          autoFitMesh(mesh, 2.0);
          
          // Group container
          const group = new THREE.Group();
          group.add(mesh);
          group.visible = false;
          this.root.add(group);
          
          modelInfo.group = group;
          modelInfo.meshes = [mesh];
          
          resolve();
        },
        undefined,
        reject
      );
    });
  }
  
  /**
   * Charge fichier OBJ (+ MTL optionnel)
   */
  async _loadOBJ(modelInfo) {
    // Charge MTL si existe
    const mtlPath = modelInfo.path.replace('.obj', '.mtl');
    
    return new Promise((resolve, reject) => {
      const objLoader = new OBJLoader();
      
      objLoader.load(
        modelInfo.path,
        (obj) => {
          // Flatten tous les meshes
          const meshes = [];
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = this.materialRef.current;
              meshes.push(child);
            }
          });
          
          // Auto-fit global
          const bbox = new THREE.Box3().setFromObject(obj);
          const center = bbox.getCenter(new THREE.Vector3());
          const size = bbox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.0 / maxDim;
          
          obj.position.set(-center.x, -center.y, -center.z);
          obj.scale.setScalar(scale);
          
          // Calcul données explosion
          meshes.forEach(mesh => {
            const meshBbox = new THREE.Box3().setFromObject(mesh);
            const meshCenter = meshBbox.getCenter(new THREE.Vector3());
            
            // Direction explosion = vecteur normalisé depuis centre global
            const explosionDir = meshCenter.clone().normalize();
            
            mesh.userData.initialPos = mesh.position.clone();
            mesh.userData.explosionDir = explosionDir;
            mesh.userData.explosionCenter = meshCenter;
          });
          
          obj.visible = false;
          this.root.add(obj);
          
          modelInfo.group = obj;
          modelInfo.meshes = meshes;
          
          resolve();
        },
        undefined,
        reject
      );
    });
  }
}
```

---

## 📡 PROTOCOLE WEBSOCKET v2

### Format message

```typescript
interface WebSocketMessage {
  v: number;              // Version protocole (2)
  ts: number;             // Timestamp ms
  g: GestureData;         // Données gestes
  dbg: DebugData;         // Debug info
  preview?: string;       // Preview webcam (base64 JPEG)
}

interface GestureData {
  rot: {
    dx: number;           // Delta rotation X [-1, 1]
    dy: number;           // Delta rotation Y [-1, 1]
  };
  zoom: {
    dz: number;           // Delta zoom [-1, 1]
  };
  explode: number;        // Facteur explosion [0, 1]
  freeze: boolean;        // État freeze
  mode: GestureMode;      // IDLE|ROTATE|ZOOM|EXPLODE|FREEZE
}

interface DebugData {
  hands: number;          // Nombre mains détectées
  frame: number;          // Numéro frame
}
```

### Exemple complet

```json
{
  "v": 2,
  "ts": 1699876543210,
  "g": {
    "rot": {
      "dx": 0.005432,
      "dy": -0.002134
    },
    "zoom": {
      "dz": 0.001234
    },
    "explode": 0.35,
    "freeze": false,
    "mode": "ROTATE"
  },
  "dbg": {
    "hands": 1,
    "frame": 12345
  },
  "preview": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

## 🎨 SHADER HOLOGRAPHIQUE

### Vertex Shader

```glsl
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader

```glsl
uniform float time;
uniform vec3 color;
uniform float glitchAmount;
uniform float scanPhase;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Fresnel effect (glow edges)
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);
  
  // Scan lines
  float scan = 0.0;
  if (scanPhase >= 0.0) {
    float scanPos = scanPhase * 2.0 - 1.0;
    float dist = abs(vPosition.y - scanPos);
    scan = smoothstep(0.1, 0.0, dist) * 0.5;
  }
  
  // Glitch effect
  vec3 glitchColor = color;
  if (glitchAmount > 0.5) {
    glitchColor.r += sin(vUv.y * 50.0 + time * 10.0) * 0.3;
    glitchColor.g += cos(vUv.x * 50.0 + time * 10.0) * 0.3;
  }
  
  // Combine
  vec3 finalColor = glitchColor * (0.3 + fresnel * 0.7 + scan);
  float alpha = 0.6 + fresnel * 0.4;
  
  gl_FragColor = vec4(finalColor, alpha);
}
```

---

**Fin du document technique** | Holo-Control V3 Premium Architecture
