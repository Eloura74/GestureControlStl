# Holo-Control v2 🎮

Contrôle gestuel holographique pour modèles 3D avec feedback visuel en temps réel.

## 🚀 Fonctionnalités v2

### 🎯 HUD Temps Réel
- **Barres de rotation** (X/Y) avec indicateurs visuels colorés
- **Barre de zoom** avec gradient directionnel
- **Barre d'explosion** pour le facteur d'éclatement
- **Indicateur de freeze** avec animation pulsée
- Interface semi-transparente avec effet holographique

### 📹 Webcam Picture-in-Picture
- Aperçu webcam activable/désactivable
- Bouton toggle flottant avec indicateur LIVE
- Interface compacte (320x180px) dans le coin inférieur droit
- Mise à jour en temps réel de la capture

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

### Python (avec environnement virtuel recommandé)

```bash
# Créer un environnement virtuel (optionnel mais recommandé)
python -m venv .venv310

# Activer l'environnement virtuel
# Windows
.venv310\Scripts\activate

# Linux/Mac
source .venv310/bin/activate

# Installer les dépendances Python
pip install opencv-python mediapipe numpy websockets
```

### Node.js

```bash
# Installation des dépendances Node.js
npm install
```

## 🏃 Démarrage

### Terminal 1 : Serveur de gestes
```bash
python gestures_server.py
```

### Terminal 2 : Interface React
```bash
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173)

## 🎨 Structure du Projet

```
holo-control/
├── gestures_server.py          # Serveur WebSocket + détection gestes
├── src/
│   ├── App.jsx                 # Composant principal + Three.js
│   ├── components/
│   │   ├── GesturesHUD.jsx     # HUD des gestes
│   │   ├── GesturesHUD.css     # Styles HUD holographique
│   │   ├── WebcamPiP.jsx       # Picture-in-Picture webcam
│   │   └── WebcamPiP.css       # Styles PiP
│   └── main.jsx
├── public/
│   └── models/
│       └── model.stl           # Modèle 3D (optionnel)
└── package.json
```

## ⚙️ Configuration

### Serveur Python (`gestures_server.py`)
```python
# Gains de contrôle
ROT_GAIN = 0.006        # Sensibilité rotation
ZOOM_GAIN = 0.002       # Sensibilité zoom
EXP_GAIN = 0.02         # Vitesse explosion

# Stabilisation
ROT_DEADZONE = 0.004    # Zone morte rotation
ZOOM_DEADZONE = 0.015   # Zone morte zoom
SMOOTH = 0.7            # Lissage (0-1)

# Webcam preview
PREVIEW_ENABLE = True
PREVIEW_EVERY = 4       # 1 frame / 4 envoyée
PREVIEW_JPEG_QUALITY = 65
```

## 🎯 Utilisation

1. **Calibration** : Placez votre main devant la webcam
2. **Rotation** : Déplacez votre poignet pour faire pivoter le modèle
3. **Zoom** : Utilisez deux mains, rapprochez/éloignez les index
4. **Explosion** : Levez l'index pour faire exploser le modèle
5. **Freeze** : Fermez le poing pour geler les mouvements
6. **Toggle Webcam** : Cliquez sur le bouton 📹 pour masquer/afficher

## 🛠️ Technologies

- **Frontend** : React 19 + Three.js + Vite
- **Backend** : Python + OpenCV + MediaPipe + WebSockets
- **3D** : Three.js + STLLoader
- **Gestes** : MediaPipe Hands

## 📝 Notes v2

### Améliorations apportées
✅ HUD avec barres visuelles pour tous les gestes  
✅ Webcam PiP activable/désactivable  
✅ Deadzones et seuils robustes  
✅ Code restructuré et modulaire  
✅ Suppression des fichiers redondants  
✅ Interface holographique cohérente  

### Performance
- FPS limité à 30 pour équilibre réactivité/performance
- Preview webcam optimisée (320x180, JPEG 65%)
- Rendu Three.js avec antialiasing et pixel ratio limité

## 🐛 Dépannage

**Webcam non détectée** : Vérifiez les permissions navigateur  
**Gestes instables** : Ajustez `ROT_DEADZONE` et `SMOOTH`  
**Latence réseau** : Le serveur doit être local (127.0.0.1)  
**Modèle absent** : Un cube de fallback s'affiche automatiquement

---

**Version** : 2.0  
**Licence** : MIT  
**Auteur** : Holo-Control Team
