# 📚 DOCUMENTATION COMPLÈTE - HOLO-CONTROL V3 PREMIUM

> **Système de visualisation 3D holographique contrôlé par gestes de la main**  
> Version : 3.0 Premium | Date : 13 Novembre 2025

---

## 📑 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Arborescence](#arborescence)
4. [Backend Python](#backend-python)
5. [Frontend React](#frontend-react)
6. [Système de gestes](#système-de-gestes)
7. [Configuration](#configuration)
8. [API WebSocket](#api-websocket)
9. [Utilisation](#utilisation)

---

## 🎯 VUE D'ENSEMBLE

### Concept
Application de visualisation 3D permettant de manipuler des modèles par gestes de la main via webcam.

### Stack technique
- **Backend** : Python 3.11+ (FastAPI + MediaPipe + OpenCV)
- **Frontend** : React 18 + Vite + Three.js
- **Communication** : WebSocket temps réel
- **Détection** : MediaPipe Hands (21 landmarks/main)
- **Rendu** : Three.js + post-processing

### Fonctionnalités
✅ Rotation 3D gestuelle  
✅ Zoom/Dezoom dynamique  
✅ Explosion multi-pièces  
✅ Freeze/Lock instantané  
✅ Enregistrement/Replay  
✅ Galerie modèles  
✅ Effets holographiques  
✅ Support STL + OBJ  
✅ Auto-fit intelligent  
✅ Webcam PiP  

---

## 🏗️ ARCHITECTURE

### Schéma global
```
┌──────────────┐    WebSocket     ┌──────────────┐
│   BACKEND    │ ◄─────────────► │  FRONTEND    │
│ Python/FastAPI│   JSON v2       │  React/Vite  │
└──────────────┘                  └──────────────┘
      │                                  │
      ├─ MediaPipe                      ├─ Three.js
      ├─ FSM                            ├─ Components
      ├─ Kalman                         └─ Managers
      └─ Config
```

### Flux de données
```
Webcam → MediaPipe → Processor → FSM → WebSocket → React → Three.js
```

---

## 📁 ARBORESCENCE

```
holo-control/
├── server_v3.py              # Serveur FastAPI
├── config.toml               # Configuration
├── requirements_v2.txt       # Dépendances Python
├── package.json              # Dépendances Node
├── start_v3.bat              # Démarrage
├── test_camera.py            # Test webcam
│
├── core/                     # Backend Python
│   ├── config.py             # Gestionnaire config
│   ├── fsm.py                # Machine à états
│   └── kalman.py             # Filtre Kalman
│
├── src/                      # Frontend React
│   ├── main.jsx              # Entry point
│   ├── AppV3_Premium.jsx     # App principale (38KB)
│   │
│   ├── components/           # UI React
│   │   ├── HoloControlBar.jsx
│   │   ├── RecorderPanel.jsx
│   │   ├── ModelGallery.jsx
│   │   ├── WebcamPiP.jsx
│   │   ├── GesturesHUDV2.jsx
│   │   └── ...
│   │
│   └── three/                # Modules 3D
│       ├── MultiSTLManager.js
│       ├── GestureRecorder.js
│       ├── ParticleSystem.js
│       ├── utils.js
│       └── ...
│
└── public/models/            # Modèles 3D
    ├── frame_bolt.stl
    ├── roller_bearing.stl
    └── bearing.obj
```

---

## 🐍 BACKEND PYTHON

### server_v3.py (23KB)

#### GestureProcessor
Classe principale de traitement des gestes.

**Méthodes clés :**
```python
def process_frame(hands_landmarks):
    """Analyse landmarks et retourne deltas"""
    return {
        "rot_dx": float,     # Delta rotation X
        "rot_dy": float,     # Delta rotation Y  
        "zoom_delta": float, # Delta zoom
        "explode": float,    # Facteur explosion [0-1]
        "mode": str,         # IDLE/ROTATE/ZOOM/EXPLODE/FREEZE
        "freeze": bool
    }

def is_fist_closed(landmarks) -> bool
def is_hand_open(landmarks) -> bool
def is_pinching(landmarks, threshold) -> (bool, float)
```

**Lissage :**
- Kalman Filter sur positions poignet
- Adaptive Deadzone sur mouvements
- Smoothing exponentiel vitesses

#### FastAPI Endpoints
```python
@app.websocket("/ws")          # WebSocket principal
@app.get("/")                  # Page accueil
@app.get("/health")            # Health check
```

#### Camera Loop
```python
async def camera_loop():
    """Boucle 60 FPS: capture → détection → envoi"""
    1. cv2.VideoCapture()
    2. MediaPipe.process()
    3. GestureProcessor.process_frame()
    4. WebSocket.send() à tous clients
```

---

### core/fsm.py (8KB)

#### Machine à états (FSM)

**États :**
- `IDLE` : Inactif, rotation auto
- `ROTATE` : Rotation manuelle (1 main)
- `ZOOM` : Zoom (2 pincements)
- `EXPLODE` : Explosion (2 mains écartées)
- `FREEZE` : Gel (poing fermé)

**Priorités :**
1. FREEZE (poing) → priorité absolue
2. ZOOM (2 pincements)
3. EXPLODE (2 mains écartées)
4. ROTATE (1 main)
5. IDLE (défaut)

**Dwell times :**
Temps minimum avant transition (évite oscillations) :
- ROTATE : 80ms
- ZOOM : 80ms
- EXPLODE : 100ms
- IDLE : 120ms
- FREEZE : 0ms (immédiat)

**Méthodes :**
```python
def update(hands, is_fist, is_pinch_l, is_pinch_r, ...) -> GestureMode
def can_apply_gesture(gesture_type) -> bool
```

---

### core/kalman.py (5KB)

#### Filtre de Kalman 2D
Lisse les positions pour réduire jitter.

```python
class KalmanFilter2D:
    def __init__(self, process_var=1e-5, measure_var=1e-4)
    def update(x, y) -> (x_smooth, y_smooth)
    def reset()
```

**Utilisation :**
```python
kf = KalmanFilter2D()
x_smooth, y_smooth = kf.update(x_raw, y_raw)
```

---

### core/config.py (7KB)

#### ConfigManager
Gestion TOML centralisée.

```python
class ConfigManager:
    def get(*keys, default=None)
    def reload()
```

**Accès :**
```python
config = ConfigManager("config.toml")
fps = config.get('camera', 'fps_limit')
```

---

## ⚛️ FRONTEND REACT

### AppV3_Premium.jsx (38KB)

Composant principal intégrant tout.

**Structure :**
```javascript
export default function AppV3Premium() {
  // REFS
  const mountRef = useRef(null);    // Container 3D
  const wsRef = useRef(null);       // WebSocket
  const stateRef = useRef({});      // État partagé
  
  // STATE
  const [currentMode, setCurrentMode] = useState("IDLE");
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // 1. Init Three.js (scene, camera, renderer)
    // 2. Post-processing (bloom, effects)
    // 3. Particules holographiques
    // 4. Connexion WebSocket
    // 5. Chargement modèles 3D
    // 6. Event listeners
    // 7. Animation loop (60 FPS)
    
    return () => { /* cleanup */ };
  }, []);
}
```

**Sections clés :**
- Scene Three.js (PerspectiveCamera, WebGLRenderer)
- Post-processing (EffectComposer, BloomPass)
- Particules (DirectionalParticleSystem)
- Anneaux holographiques (3 rings pulsants)
- Étoiles background
- MultiSTLManager (gestion modèles)
- WebSocket client
- Animation loop

---

### Composants UI

#### HoloControlBar.jsx (9KB)
Barre contrôle principale.

**Affichage :**
- Mode actif avec badge coloré
- Indicateur connexion
- Boutons : Record, Play, Stop, Reset, Snapshot, Gallery
- Slider explosion
- FPS counter

#### RecorderPanel.jsx (10KB)
Panneau enregistrement gestes.

**Fonctions :**
- Liste recordings (localStorage)
- Record/Stop/Play/Pause
- Timeline scrubbing
- Export/Import JSON
- Delete recordings

**Format :**
```json
{
  "name": "Recording 1",
  "timestamp": 1699876543,
  "duration": 15.3,
  "frames": [
    {"time": 0.016, "rotX": 0.1, "rotY": -0.05, ...},
    ...
  ]
}
```

#### ModelGallery.jsx (4.5KB)
Galerie modèles 3D.

- Grid responsive
- Miniatures + noms
- Sélection modèle actif
- Transitions animées

#### WebcamPiP.jsx (1.8KB)
Picture-in-Picture webcam.

- Preview base64 du serveur
- Draggable + resizable
- Toggle avec touche V

#### GesturesHUDV2.jsx (3.8KB)
HUD informations détaillées.

**Affiche :**
- Mode + icône
- Rotation X/Y
- Zoom
- Explosion %
- Mains détectées
- FPS
- Latence

---

### Modules Three.js

#### MultiSTLManager.js (20KB)
Gestionnaire multi-modèles.

**API :**
```javascript
const manager = new MultiSTLManager(scene, materialRef);

manager.addModel('Bolt', '/models/bolt.stl', 'stl');
manager.addModel('Bearing', '/models/bearing.obj', 'obj');

await manager.loadAllModels();
manager.switchToModel('Bearing');
manager.applyExplosion(0.5);  // 0-1
```

**Explosion OBJ :**
- Calcule centre chaque mesh
- Direction radiale normalisée
- Offset = direction × factor × 3.0

#### GestureRecorder.js (10.5KB)
Enregistrement/Replay gestes.

**API :**
```javascript
const recorder = new GestureRecorder();

recorder.startRecording();
recorder.recordFrame({rotX, rotY, zoom, explode, mode});
recorder.stopRecording();

recorder.play(recordingId);
recorder.pause();
recorder.stop();
```

#### ParticleSystem.js (8.6KB)
Particules holographiques directionnelles.

**Config :**
```javascript
new DirectionalParticleSystem({
  count: 1500,
  color: 0x00ffff,
  size: 0.015,
  opacity: 0.6,
  flowSpeed: 0.3
});
```

#### utils.js (8.8KB)
Utilitaires 3D.

**Fonctions :**
```javascript
autoFitMesh(mesh, targetSize=2.0)
  // Centre + scale pour fit bbox

createEnhancedHolographicShader()
  // Retourne ShaderMaterial avec effets
```

---

## 🎮 SYSTÈME DE GESTES

### Gestes détectés

| Geste | Description | Action |
|-------|-------------|--------|
| 🖐️ **1 main ouverte** | 3+ doigts levés | ROTATE |
| 🤏🤏 **2 pincements** | Pouce-index < 8cm | ZOOM |
| ✋✋ **2 mains écartées** | Mains ouvertes éloignées | EXPLODE |
| 🤜 **Poing fermé** | ≤1 doigt levé | FREEZE |

### Landmarks MediaPipe (21 points/main)
```
0: Poignet (WRIST)
1-4: Pouce (THUMB)
5-8: Index (INDEX)
9-12: Majeur (MIDDLE)
13-16: Annulaire (RING)
17-20: Auriculaire (PINKY)
```

### Calculs

**Rotation :**
```python
delta = current_wrist - previous_wrist
rot_dx = delta[0] * sensitivity
rot_dy = delta[1] * sensitivity
```

**Zoom :**
```python
dist = distance(pinch_left, pinch_right)
zoom_delta = (dist - prev_dist) * scale
```

**Explosion :**
```python
if mode == EXPLODE:
    explode += speed * dt
else:
    explode -= speed * dt
explode = clamp(explode, 0, 1)
```

---

## ⚙️ CONFIGURATION

### config.toml

```toml
[camera]
index = 0               # Index webcam
width = 1280
height = 720
fps_limit = 60

[mediapipe]
max_num_hands = 2
min_detection_confidence = 0.6
min_tracking_confidence = 0.6
model_complexity = 1    # 0=lite, 1=full, 2=heavy

[gestures]
pinch_threshold = 0.08       # Distance pincement
zoom_deadzone = 0.002        # Zone morte zoom
rotation_sensitivity = 1.0   # Multiplicateur rotation
explosion_speed = 0.03       # Vitesse explosion
kalman_enabled = true        # Activer lissage

[fsm]
dwell_rotate = 80      # ms avant ROTATE
dwell_zoom = 80
dwell_explode = 100
dwell_idle = 120

[preview]
enabled = false
width = 320
height = 180
jpeg_quality = 65
send_every_n_frames = 4
```

---

## 🔌 API WEBSOCKET

### Protocole v2

**Client → Serveur (Heartbeat) :**
```json
{"type": "ping"}
```

**Serveur → Client (60 FPS) :**
```json
{
  "v": 2,
  "ts": 1699876543210,
  "g": {
    "rot": {"dx": 0.005, "dy": -0.002},
    "zoom": {"dz": 0.001},
    "explode": 0.35,
    "freeze": false,
    "mode": "ROTATE"
  },
  "dbg": {
    "hands": 1,
    "frame": 12345
  },
  "preview": "data:image/jpeg;base64,..." // optionnel
}
```

### Events frontend

**Émis :**
- `holo:record` - Démarrer recording
- `holo:play` - Play recording
- `holo:stop` - Stop
- `holo:reset` - Reset vue
- `holo:snapshot` - Capture écran
- `holo:gallery` - Ouvrir galerie

**Écoutés :**
- `holo:hud` - Update HUD
- `measure:update` - Update mesure
- `multiSTL:list` - Liste modèles
- `multiSTL:select` - Sélection modèle

---

## 📖 UTILISATION

### Démarrage

**1. Backend :**
```bash
python server_v3.py
```

**2. Frontend :**
```bash
npm run dev
```

**3. OU utiliser start_v3.bat (Windows)**

### Raccourcis clavier

| Touche | Action |
|--------|--------|
| **R** | Reset vue |
| **Space** | Toggle record |
| **P** | Play/Pause |
| **G** | Toggle gallery |
| **V** | Toggle webcam PiP |
| **ESC** | Clear mesure |
| **F** | Toggle fullscreen |

### Utilisation gestes

1. **Rotation** : Levez 1 main ouverte, bougez pour tourner
2. **Zoom** : Pincez avec 2 mains, écartez/rapprochez
3. **Explosion** : Ouvrez 2 mains, écartez-les
4. **Freeze** : Fermez le poing
5. **Reset** : Touche R ou bouton

### Enregistrement

1. Cliquez **⏺ Record**
2. Effectuez gestes
3. Cliquez **⏹ Stop**
4. Le recording apparaît dans le panel
5. Cliquez **▶️ Play** pour rejouer

### Changement modèle

1. Cliquez icône **galerie** (bas droite)
2. Sélectionnez modèle dans la grille
3. Le modèle change instantanément

---

## 📊 PERFORMANCES

### Optimisations

**Backend :**
- Kalman filter (réduit calculs inutiles)
- Adaptive deadzone (ignore micro-mouvements)
- Frame skip intelligent
- JPEG compression preview

**Frontend :**
- requestAnimationFrame (sync 60 FPS)
- EffectComposer (batch rendering)
- Geometry instancing particules
- Lazy loading modèles
- WebGL optimisé

### Métriques typiques
- **FPS** : 55-60 constant
- **Latence** : 15-30ms
- **RAM Backend** : ~300MB
- **RAM Frontend** : ~200MB
- **GPU** : iGPU suffit (dédié recommandé)

---

## 🛠️ DÉVELOPPEMENT

### Ajout modèle 3D

1. Placer fichier dans `public/models/`
2. Éditer `AppV3_Premium.jsx` :
```javascript
multiSTL.addModel('Mon Modèle', '/models/mon_modele.stl', 'stl');
```
3. Reload app

### Ajout geste

1. Éditer `server_v3.py → GestureProcessor`
2. Ajouter méthode `is_mon_geste(landmarks)`
3. Intégrer dans `process_frame()`
4. Modifier FSM si besoin

### Debug

**Backend logs :**
```bash
tail -f logs/server.log
```

**Frontend console :**
```javascript
console.log(stateRef.current);
```

**WebSocket monitor :**
DevTools → Network → WS

---

## 📝 NOTES TECHNIQUES

### MediaPipe Hands
- **21 landmarks 3D** par main (x, y, z)
- **z** = profondeur relative (non utilisé ici)
- Coordonnées normalisées [0-1]
- Main gauche = index 0, droite = index 1

### Three.js Scene Graph
```
scene
├── root (Group)
│   ├── mesh (modèle actuel)
│   ├── rings[0..2] (anneaux)
│   └── particleSystem
├── stars (Points)
├── lights (Directional + Ambient)
└── fog (volumétrique)
```

### État partagé (stateRef)
```javascript
{
  rotX, rotY,           // Rotation actuelle
  targetRotX, targetRotY, // Rotation cible
  distance, targetDistance,
  explode,              // [0-1]
  freeze,               // bool
  mode,                 // string
  lastMessage,          // dernier msg WS
  playbackActive,       // bool
  idleTime              // secondes
}
```

---

## 🐛 TROUBLESHOOTING

### Caméra ne marche pas
```bash
python test_camera.py
```
Vérifier index dans `config.toml`

### WebSocket ne connecte pas
- Vérifier serveur lancé (port 8000)
- Firewall autorisé ?
- URL correcte (localhost:8000)

### FPS bas
- Réduire `particles count` (1500 → 500)
- Désactiver bloom
- Modèle trop complexe ?

### Gestes ne répondent pas
- Vérifier éclairage webcam
- Ajuster `min_detection_confidence`
- Vérifier FSM logs

---

**Fin de la documentation** | Projet : Holo-Control V3 Premium | © 2025
