# 📚 API REFERENCE - HOLO-CONTROL V3

> Index complet des classes, fonctions et API

---

## 🐍 PYTHON API

### server_v3.py

#### Classes

##### **GestureProcessor**
```python
class GestureProcessor:
    def __init__(config: ConfigManager)
    def process_frame(hands_landmarks: list) -> dict
    def is_fist_closed(landmarks) -> bool
    def is_hand_open(landmarks) -> bool
    def is_pinching(landmarks, threshold=0.08) -> tuple[bool, float]
    def finger_extended(landmarks, tip, pip) -> bool
    def is_measure_gesture(landmarks) -> bool
```

##### **AdaptiveDeadzone**
```python
class AdaptiveDeadzone:
    def __init__(base_deadzone=0.001, scale_factor=10.0)
    def apply(value: float, variance: float) -> float
```

#### Fonctions

```python
async def camera_loop()
async def websocket_endpoint(websocket: WebSocket)
async def root()
async def health()
```

---

### core/config.py

#### **ConfigManager**
```python
class ConfigManager:
    def __init__(config_path="config.toml")
    def get(*keys, default=None) -> Any
    def reload() -> None
    def _load_config(path) -> dict
    def _apply_defaults() -> None
```

---

### core/fsm.py

#### **GestureMode** (Enum)
```python
class GestureMode(Enum):
    IDLE = "IDLE"
    ROTATE = "ROTATE"
    ZOOM = "ZOOM"
    EXPLODE = "EXPLODE"
    FREEZE = "FREEZE"
```

#### **GestureFSM**
```python
class GestureFSM:
    def __init__(dwell_ms: dict = None)
    def update(hands_detected, is_fist, is_pinch_left, is_pinch_right, is_index_up, is_measure=False) -> GestureMode
    def can_apply_gesture(gesture_type: str) -> bool
    def reset() -> None
    def get_stats() -> dict
    def _enter_mode(new_mode: GestureMode) -> None
    def _can_transition(target_mode: GestureMode) -> bool
    def _time_in_current_mode() -> float
```

---

### core/kalman.py

#### **KalmanFilter2D**
```python
class KalmanFilter2D:
    def __init__(process_variance=1e-5, measurement_variance=1e-4)
    def update(x: float, y: float) -> tuple[float, float]
    def reset() -> None
    @property
    def variance() -> float
```

---

## ⚛️ JAVASCRIPT API

### AppV3_Premium.jsx

#### Composant principal
```javascript
export default function AppV3Premium()
```

#### Fonctions internes
```javascript
function connectWebSocket()
function animate()
function placeMarkerAtHand(handPos, markerNumber)
function resetMarkers()
```

---

### three/MultiSTLManager.js

#### **MultiSTLManager**
```javascript
class MultiSTLManager {
  constructor(scene, materialRef)
  
  // Gestion modèles
  addModel(name, path, type)
  async loadAllModels()
  async loadModel(modelInfo)
  switchToModel(name)
  getCurrentModel()
  getModelList()
  
  // Effets
  applyExplosion(factor)
  resetExplosion()
  
  // Interne
  _loadSTL(modelInfo)
  _loadOBJ(modelInfo)
  _prepareExplosionData(meshes)
  
  // Cleanup
  dispose()
}
```

**Events émis :**
- `multiSTL:loaded` - Modèle chargé
- `multiSTL:switched` - Modèle changé
- `multiSTL:error` - Erreur chargement

---

### three/GestureRecorder.js

#### **GestureRecorder**
```javascript
class GestureRecorder {
  constructor()
  
  // Recording
  startRecording()
  stopRecording()
  recordFrame(data)
  
  // Playback
  play(recordingId)
  pause()
  stop()
  getPlaybackFrame(time)
  
  // Gestion
  saveRecording(name)
  loadRecordings()
  deleteRecording(id)
  exportRecording(id)
  importRecording(jsonData)
  
  // Getters
  get isRecording()
  get isPlaying()
  get recordings()
  get currentRecording()
}
```

#### **RecorderUIController**
```javascript
class RecorderUIController {
  constructor(recorder)
  
  toggleRecording()
  togglePlayback()
  updateUI()
  
  dispose()
}
```

---

### three/ParticleSystem.js

#### **DirectionalParticleSystem**
```javascript
class DirectionalParticleSystem {
  constructor(options)
  
  update(deltaTime)
  setFlowDirection(x, y, z)
  setOpacity(opacity)
  
  dispose()
}
```

**Options :**
```javascript
{
  count: 1500,           // Nombre particules
  color: 0x00ffff,       // Couleur
  size: 0.015,           // Taille
  opacity: 0.6,          // Opacité
  flowSpeed: 0.3,        // Vitesse flux
  spawnRadius: 3.0,      // Rayon spawn
  lifetime: 5.0          // Durée vie (s)
}
```

#### **VolumetricGradient**
```javascript
class VolumetricGradient {
  constructor(options)
  
  update(time)
  
  dispose()
}
```

---

### three/utils.js

#### Fonctions

```javascript
/**
 * Auto-fit mesh dans viewport
 */
function autoFitMesh(mesh, targetSize=2.0)

/**
 * Crée shader holographique
 */
function createEnhancedHolographicShader()

/**
 * Calcule bbox objet
 */
function computeBoundingBox(object)

/**
 * Centre objet sur origine
 */
function centerObject(object)
```

---

### components/HoloControlBar.jsx

```javascript
export default function HoloControlBar()
```

**Props :** Aucune (utilise events)

**Events émis :**
- `holo:record`
- `holo:play`
- `holo:stop`
- `holo:reset`
- `holo:snapshot`
- `holo:gallery`

**Events écoutés :**
- `holo:hud` - Update valeurs HUD

---

### components/RecorderPanel.jsx

```javascript
export default function RecorderPanel()
```

**State :**
- `recordings` - Liste enregistrements
- `isOpen` - Panel ouvert/fermé
- `selectedRecording` - Recording sélectionné

**Functions :**
- `handleRecord()`
- `handlePlay(recordingId)`
- `handleDelete(recordingId)`
- `handleExport(recordingId)`
- `handleImport(file)`

---

### components/ModelGallery.jsx

```javascript
export default function ModelGallery()
```

**State :**
- `models` - Liste modèles
- `currentModel` - Modèle actif
- `isOpen` - Galerie visible

**Events :**
- `multiSTL:list` → Récupère liste
- `multiSTL:select` → Change modèle

---

### components/WebcamPiP.jsx

```javascript
export default function WebcamPiP()
```

**Props :** Aucune

**State :**
- `isVisible` - PiP visible
- `isDragging` - En cours drag
- `position` - {x, y}

**Keyboard :**
- `V` - Toggle visible

---

### components/GesturesHUDV2.jsx

```javascript
export default function GesturesHUDV2()
```

**Props :** Aucune

**Events écoutés :**
- `holo:hud` - Update données

**Affichage :**
- Mode actif
- Rotation X/Y
- Zoom
- Explosion %
- Mains
- FPS
- Latence

---

### components/MeasureDisplay.jsx

```javascript
export default function MeasureDisplay()
```

**Events écoutés :**
- `measure:update` - Update distance

**State :**
- `measure` - {active, distance}

---

## 📡 EVENTS CUSTOM

### Frontend → Frontend

```javascript
// Recording
new CustomEvent('holo:record')
new CustomEvent('holo:play')
new CustomEvent('holo:stop')
new CustomEvent('holo:reset')

// HUD
new CustomEvent('holo:hud', {
  detail: {
    rotX, rotY, zoom, explode, mode, hands, fps, latency
  }
})

// Modèles
new CustomEvent('multiSTL:list', {
  detail: { models: [] }
})

new CustomEvent('multiSTL:select', {
  detail: { name: string }
})

new CustomEvent('multiSTL:switched', {
  detail: { name, model }
})

// Mesure
new CustomEvent('measure:update', {
  detail: { active, distance, pos1, pos2 }
})

new CustomEvent('measure:markers', {
  detail: { point1: bool, point2: bool }
})
```

---

## 🔧 CONFIGURATION

### config.toml - Structure complète

```toml
[camera]
index = 0               # Index webcam (0-9)
width = 1280            # Largeur frame
height = 720            # Hauteur frame
fps_limit = 60          # FPS max

[mediapipe]
max_num_hands = 2                    # Nombre mains max
min_detection_confidence = 0.6       # Seuil détection [0-1]
min_tracking_confidence = 0.6        # Seuil tracking [0-1]
model_complexity = 1                 # 0=lite, 1=full, 2=heavy

[gestures]
pinch_threshold = 0.08               # Distance pincement
zoom_deadzone = 0.002                # Zone morte zoom
rotation_sensitivity = 1.0           # Sensibilité rotation
explosion_speed = 0.03               # Vitesse explosion
kalman_enabled = true                # Activer Kalman

[fsm]
dwell_rotate = 80       # Dwell time ROTATE (ms)
dwell_zoom = 80         # Dwell time ZOOM (ms)
dwell_explode = 100     # Dwell time EXPLODE (ms)
dwell_idle = 120        # Dwell time IDLE (ms)

[preview]
enabled = false                 # Activer preview webcam
width = 320                     # Largeur preview
height = 180                    # Hauteur preview
jpeg_quality = 65               # Qualité JPEG [0-100]
send_every_n_frames = 4         # Envoyer 1 frame sur N
```

---

## 🗂️ TYPES & INTERFACES

### TypeScript Definitions

```typescript
// Gesture data
interface GestureData {
  rot: { dx: number; dy: number };
  zoom: { dz: number };
  explode: number;
  freeze: boolean;
  mode: GestureMode;
}

// WebSocket message
interface WSMessage {
  v: number;
  ts: number;
  g: GestureData;
  dbg: { hands: number; frame: number };
  preview?: string;
}

// Recording frame
interface RecordingFrame {
  time: number;
  rotX: number;
  rotY: number;
  zoom: number;
  explode: number;
  mode: string;
}

// Recording
interface Recording {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  frames: RecordingFrame[];
}

// Model info
interface ModelInfo {
  name: string;
  path: string;
  type: 'stl' | 'obj';
  loaded: boolean;
  group: THREE.Group | null;
  meshes: THREE.Mesh[];
}

// Hand landmarks (MediaPipe)
interface Landmark {
  x: number;     // [0-1] normalized
  y: number;     // [0-1] normalized
  z: number;     // depth (relative)
}

type HandLandmarks = Landmark[]; // 21 points
```

---

## 📦 CONSTANTS

### MediaPipe Landmarks Index

```javascript
const LANDMARKS = {
  WRIST: 0,
  
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
};
```

### Gesture Modes

```python
# Python
class GestureMode(Enum):
    IDLE = "IDLE"
    ROTATE = "ROTATE"
    ZOOM = "ZOOM"
    EXPLODE = "EXPLODE"
    FREEZE = "FREEZE"
```

```javascript
// JavaScript
const GESTURE_MODES = {
  IDLE: 'IDLE',
  ROTATE: 'ROTATE',
  ZOOM: 'ZOOM',
  EXPLODE: 'EXPLODE',
  FREEZE: 'FREEZE'
};
```

---

## 🎯 QUICK REFERENCE

### Démarrage rapide

```bash
# Backend
python server_v3.py

# Frontend
npm run dev

# OU tout-en-un (Windows)
start_v3.bat
```

### Imports Python

```python
from core.config import ConfigManager
from core.fsm import GestureFSM, GestureMode
from core.kalman import KalmanFilter2D
```

### Imports JavaScript

```javascript
import MultiSTLManager from './three/MultiSTLManager';
import GestureRecorder from './three/GestureRecorder';
import { DirectionalParticleSystem } from './three/ParticleSystem';
import { autoFitMesh, createEnhancedHolographicShader } from './three/utils';
```

---

**Fin de l'API Reference** | Holo-Control V3 Premium
