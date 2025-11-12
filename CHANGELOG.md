# Changelog - Holo-Control

## [v2.0.0] - 2025-11-11

### ✨ Nouvelles Fonctionnalités

#### HUD Temps Réel
- Ajout d'un HUD holographique dans le coin supérieur gauche
- Barres visuelles pour RotX, RotY, Zoom et Explode
- Indicateur de freeze avec animation pulsée
- Valeurs numériques affichées en temps réel
- Design cohérent avec l'esthétique holographique du projet

#### Webcam Picture-in-Picture
- Aperçu de la webcam en temps réel dans le coin inférieur droit
- Bouton toggle flottant pour activer/désactiver la webcam
- Indicateur "LIVE" animé
- Compression optimisée (JPEG 65%, 320x180px)
- Interface compacte et non-intrusive

### 🎚️ Améliorations de Stabilité

#### Deadzones Avancées
- **Rotation** : Deadzone augmentée à 0.004 unités
- **Zoom** : Deadzone de 0.015 unités pour éviter les micro-variations
- Application indépendante sur chaque axe

#### Seuils d'Activation
- **Rotation** : Seuil minimum de 0.008 avant application
- **Zoom** : Seuil minimum de 0.02 avant application
- Prévient les tremblements et mouvements parasites

#### Lissage Amélioré
- Décroissance de vélocité progressive (VEL_DECAY = 0.85)
- Arrêt naturel sans à-coups
- Lissage temporel conservé (SMOOTH = 0.7)

### 🏗️ Architecture

#### Restructuration du Code
- Séparation en composants modulaires :
  - `GesturesHUD.jsx` : Gestion du HUD
  - `WebcamPiP.jsx` : Gestion de la webcam PiP
- Utilisation de Custom Events pour la communication
- Styles CSS isolés par composant

#### Nettoyage
- Suppression de `Scene3d.jsx` (redondant)
- Consolidation dans `App.jsx`
- Meilleure organisation du code

### 📝 Documentation
- README.md complet avec toutes les fonctionnalités v2
- Section configuration détaillée
- Guide d'utilisation étape par étape
- Section dépannage

### 🔧 Configuration
```python
# Nouveaux paramètres gestures_server.py
ROT_DEADZONE = 0.004
ROT_THRESHOLD = 0.008
ZOOM_DEADZONE = 0.015
ZOOM_THRESHOLD = 0.02
VEL_DECAY = 0.85
```

### 🐛 Corrections
- Stabilisation des mouvements de rotation
- Réduction des jitters lors du zoom
- Meilleure gestion de l'arrêt des mouvements

### 📦 Dépendances
- Aucune nouvelle dépendance requise
- Compatible avec l'environnement existant

---

## [v1.0.0] - Initial Release

### Fonctionnalités Initiales
- Contrôle gestuel basique avec MediaPipe
- Rotation, zoom, explosion du modèle 3D
- Détection de freeze par poing fermé
- Rendu Three.js avec modèle STL
- Serveur WebSocket Python

---

**Convention de versioning** : Semantic Versioning (MAJOR.MINOR.PATCH)
