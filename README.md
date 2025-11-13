# Holo-Control V3.1 Premium 🎮✨

Contrôle gestuel holographique de niveau production pour modèles 3D avec interface immersive et feedback visuel premium.

> **Nouvelle version V3.1** : Interface unifiée, indicateurs gestuels animés, shaders avancés, auto-fit intelligent !

## 🚀 Fonctionnalités V3.1 Premium

### ✨ HoloControlBar - Interface Unifiée **[NOUVEAU]**
- **Barre de contrôle premium** regroupant tous les contrôles en haut de l'écran
- **WebSocket status** : Indicateur online/offline avec pulsation animée
- **Mode FSM** : Badge dynamique coloré (IDLE/ROTATE/ZOOM/EXPLODE/FREEZE)
- **Toggle webcam** intégré pour activer/désactiver l'aperçu
- **Sélecteur de profil** en dropdown (Précis/Équilibré/Réactif)
- **Métriques temps réel** : FPS + latency
- **Bouton stop** pour arrêt serveur sécurisé
- Design glassmorphism avec backdrop-blur et bordures holographiques
- Responsive (mobile/tablet/desktop)

### 🎯 GestureIndicator - Retour Visuel Central **[NOUVEAU]**
- **Indicateur holographique au centre de l'écran** affichant le geste actif
- Icônes animées : ◌ IDLE, ↻ ROTATION, 🔍 ZOOM, 💥 EXPLOSION, ❄️ FREEZE
- Anneau rotatif périphérique avec pulsation
- Animations CSS spécifiques par geste (rotation 360°, scale, blur, burst)
- Label avec glow holographique
- Auto-hide après 2s d'inactivité
- Couleurs dynamiques selon le mode

### 👻 GhostReticule - Réticule 3D Flottant **[NOUVEAU]**
- **Réticule holographique** suivant la position de la main détectée
- Centre lumineux + 2 anneaux concentriques pulsants
- 4 lignes de visée (top/right/bottom/left)
- Animations adaptées :
  - ROTATE : rotation 360° + trail effect
  - ZOOM : scale in/out pulsation
  - EXPLODE : burst avec particules CSS
  - FREEZE : anneau statique
- Couleurs dynamiques

### 🎨 Shaders Holographiques Améliorés **[NOUVEAU]**
**7 effets visuels premium** :
1. **Diffraction arc-en-ciel** : Effet prisme holographique subtil
2. **Arcs électriques** : Lignes électriques style "Star Wars"
3. **Noise spatial 3D** : Simplex noise pour instabilité holographique
4. **Edge highlights Tron** : Arêtes brillantes sur surfaces
5. **Glitch occasionnel** : Effet glitch aléatoire (2% chance/frame)
6. **Wireframe procedural** : Grid 25x amélioré
7. **Scan vertical** : Bande traversante en mode IDLE

### 📏 Auto-Fit / Zoom Adaptatif **[NOUVEAU]**
- **Calcul automatique** de la distance optimale selon taille du modèle
- Basé sur bounding box + bounding sphere
- Fonctionne pour tout STL (petit ou énorme)
- Marge de sécurité 1.5x
- Centre automatique du modèle
- Logs console pour debug

### 🎯 HUD Détaillé (optionnel)
- Barres de rotation (X/Y) avec indicateurs visuels colorés
- Barre de zoom avec gradient directionnel
- Barre d'explosion pour le facteur d'éclatement
- Indicateur de freeze avec animation pulsée
- Interface semi-transparente avec effet holographique

### 📹 Webcam Picture-in-Picture
- Aperçu webcam activable/désactivable
- Synchronisé avec HoloControlBar
- Interface compacte (320x180px)
- Mise à jour en temps réel

### 🎮 Gestes Supportés
- **Rotation** : UNE seule main ouverte, déplacer le poignet gauche/droite ou haut/bas
- **Zoom** : DEUX mains en pincement (pouce+index), écarter = zoom+, rapprocher = zoom-
- **Explosion** : Index levé pour éclatement progressif
- **Freeze** : Poing fermé pour pause temporaire

### 🎚️ Stabilisation Avancée
- **Deadzones améliorées** : Ignore les micro-mouvements parasites
  - Rotation : 0.004 unités
  - Zoom : 0.015 unités
- **Seuils d'activation** : Empêche les tremblements
  - Rotation : 0.008 unités minimum
  - Zoom : 0.02 unités minimum
- **Décroissance de vélocité** : Arrêt progressif et fluide
- **Lissage temporel** : Moyenne mobile pour mouvements naturels

## 📦 Installation

### Prérequis
- **Python 3.10+**
- **Node.js 18+**
- Webcam fonctionnelle

### Python (backend)

```bash
# Installer les dépendances Python
pip install -r requirements_v2.txt

# Ou manuellement
pip install fastapi uvicorn opencv-python mediapipe numpy
```

### Node.js (frontend)

```bash
# Installation des dépendances
npm install
```

## 🏃 Démarrage Rapide

### Option 1 : Script automatique (Windows)
```bash
start_v3.bat
```

### Option 2 : Commandes séparées

**Terminal 1 - Backend** :
```bash
python server_v3.py
```

**Terminal 2 - Frontend** :
```bash
npm run dev
```

**Ouvrir** : [http://localhost:5173](http://localhost:5173)

## 🎮 Utilisation

### Raccourcis clavier
| Touche | Action |
|--------|--------|
| **R** | Reset caméra (rotation + zoom) |
| **E** | Toggle explosion manuel |
| **G** | Cycle profils gestuels |

### Gestes
1. **Rotation** : UNE main ouverte, déplacer le poignet
2. **Zoom** : DEUX mains en pincement, écarter/rapprocher
3. **Explosion** : Index levé
4. **Freeze** : Poing fermé

## 🎨 Structure du Projet

```
holo-control/
├── server_v3.py                    # Backend FastAPI + WebSocket + FSM
├── config.toml                     # Configuration système
├── core/                           # Modules backend
│   ├── config.py                   # Gestionnaire config
│   ├── kalman.py                   # Filtres Kalman
│   └── fsm.py                      # Machine à états (FSM)
├── src/
│   ├── AppV3_Premium.jsx           # App principale V3.1
│   ├── components/
│   │   ├── HoloControlBar.jsx      # ✨ Barre de contrôle unifiée
│   │   ├── GestureIndicator.jsx    # ✨ Indicateur central geste
│   │   ├── GhostReticule.jsx       # ✨ Réticule 3D
│   │   ├── GesturesHUDV2.jsx       # HUD détaillé (optionnel)
│   │   └── WebcamPiP.jsx           # Aperçu webcam
│   ├── three/
│   │   └── utils.js                # ✨ Shaders + Auto-fit
│   ├── config/
│   │   └── ux-config.js            # ✨ Configuration UX
│   └── main.jsx
├── public/
│   └── models/
│       └── Frame_Bolt.stl          # Modèle 3D exemple
├── UX_IMPROVEMENTS.md              # 📖 Documentation complète
├── MIGRATION_GUIDE.md              # 📖 Guide de migration
├── CHANGELOG_V3.1.md               # 📖 Changelog détaillé
└── package.json
```

## ⚙️ Configuration

### Backend (config.toml)
```toml
[gestures]
profile = "balanced"  # precise | balanced | reactive

[gestures.profiles.balanced]
rot_gain = 2.0
zoom_gain = 0.5
smooth = 0.5
rot_deadzone = 0.00005
zoom_deadzone = 0.002

[kalman]
enabled = true
process_noise = 0.001
measurement_noise = 0.005

[fsm]
dwell_rotate = 80    # ms
dwell_zoom = 80
dwell_explode = 100
```

### Frontend (src/config/ux-config.js)
```javascript
export const UX_CONFIG = {
  holoBar: {
    enabled: true,
    position: "top",
    width: "85%",
    opacity: 0.85
  },
  gestureIndicator: {
    enabled: true,
    size: 120,
    autoHideDelay: 2000
  },
  shaders: {
    effects: {
      diffraction: true,
      electricArcs: true,
      glitch: true
    }
  },
  autoFit: {
    enabled: true,
    marginMultiplier: 1.5
  }
};
```

## 📖 Documentation

### Guides disponibles
- **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)** : Documentation complète des améliorations V3.1
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** : Guide de migration et configuration
- **[CHANGELOG_V3.1.md](./CHANGELOG_V3.1.md)** : Changelog détaillé

### Quick Start
1. Lancer `start_v3.bat` (ou backend + frontend séparément)
2. Ouvrir http://localhost:5173
3. Placer main devant webcam
4. Utiliser gestes (rotation, zoom, explosion, freeze)
5. Observer indicateurs visuels (HoloControlBar, GestureIndicator, GhostReticule)

## 🛠️ Stack Technique

### Frontend
- **React 19** + **Vite 6**
- **Three.js** (r170) + **three-stdlib**
- **Post-processing** : EffectComposer, UnrealBloomPass
- **Shaders GLSL** : Vertex + Fragment custom

### Backend
- **FastAPI** + **Uvicorn** (async WebSocket)
- **OpenCV** (capture webcam)
- **MediaPipe Hands** (détection gestes)
- **NumPy** (calculs matriciels)

### Algorithmes
- **Kalman Filter** 1D/2D (stabilisation)
- **Adaptive Deadzone** (élimination bruit)
- **FSM** (Machine à États Finis)
- **Simplex Noise 3D** (shaders)

## 📊 Performance

### Métriques V3.1
- **FPS** : 25-30 stable (limité backend)
- **Latency** : ~40ms total (capture → traitement → rendu)
- **WebSocket** : < 10ms roundtrip
- **Shader** : GPU-bound, ~5ms/frame

### Optimisations
- Bloom pass réduit (strength 0.15)
- Stars/anneaux opacity optimisée
- Kalman filter pour stabilisation
- Deadzone adaptative
- Preview webcam throttled (1 frame / 4)

## 🎯 Nouveautés V3.1

### Interface UX Premium
✅ **HoloControlBar** : Tous contrôles unifiés  
✅ **GestureIndicator** : Retour visuel central animé  
✅ **GhostReticule** : Réticule 3D suivant la main  
✅ **Shaders avancés** : 7 effets holographiques  
✅ **Auto-fit** : Zoom adaptatif intelligent  
✅ **Mode Holo-Lock** : Freeze gestuel avec indicateurs  

### Code Quality
✅ Architecture modulaire (components/three/config)  
✅ Configuration centralisée (TOML + JS)  
✅ Events système découplés (CustomEvent)  
✅ Documentation complète (3 fichiers MD)  
✅ Backward compatible V3.0

## 🐛 Troubleshooting

| Problème | Solution |
|----------|----------|
| **Webcam non détectée** | Vérifier permissions navigateur (chrome://settings/content) |
| **HoloControlBar absent** | Hard refresh (Ctrl+F5), vérifier console F12 |
| **Gestes instables** | Ajuster profil (Précis), augmenter `rot_deadzone` |
| **Performance faible** | Désactiver bloom, réduire stars, mode "minimal" |
| **Shader cassé** | Vérifier console WebGL, fallback vers ancien shader |
| **Auto-fit incorrect** | Ajuster `marginMultiplier` dans config |

Consulter **MIGRATION_GUIDE.md** pour configuration avancée.

## 🚀 Prochaines étapes

### En développement
- [ ] Touch-Laser Mode (rayon laser 3D)
- [ ] Slice View (coupe dynamique modèle)
- [ ] Gesture Recorder + replay
- [ ] Multi-STL galerie

### Idées futures
- [ ] Export vidéo MP4 (ffmpeg)
- [ ] Mode VR/AR (WebXR)
- [ ] Cloud save gestes
- [ ] Multiplayer sync

---

## 📄 License & Credits

**Version** : V3.1.0 Premium  
**Date** : 2025-01-13  
**Status** : ✅ Production Ready  
**License** : MIT  

### Technologies
- **Three.js** - 3D rendering
- **MediaPipe** - Hand detection (Google)
- **FastAPI** - Modern Python framework
- **Simplex Noise 3D** - Ashima Arts

### Contact
Pour questions/suggestions, consulter la documentation ou créer une issue.

**Made with ❤️ by Holo-Control Team**
