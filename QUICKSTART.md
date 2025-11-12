# 🚀 Démarrage Rapide - Holo-Control v2

## 📋 Prérequis

### Python (avec venv)
```bash
# Créer et activer l'environnement virtuel
python -m venv .venv310
.venv310\Scripts\activate  # Windows

# Installer les dépendances
pip install opencv-python mediapipe numpy websockets
```

### Node.js
```bash
npm install
```

## ▶️ Lancement

### 1️⃣ Terminal 1 - Serveur Gestes
```bash
python gestures_server.py
```

Attendez le message : `[WS] listening ws://127.0.0.1:8765`

### 2️⃣ Terminal 2 - Interface Web
```bash
npm run dev
```

Ouvrir : [http://localhost:5173](http://localhost:5173)

## 🎮 Contrôles Gestuels

| Geste | Action | Main(s) |
|-------|--------|---------|
| 🖐️ **Main ouverte + bouger poignet** | Rotation du modèle | 1 seule main |
| 🤏 **Pincement écarter = zoom+, rapprocher = zoom-** | Zoom | 2 mains |
| ☝️ **Lever index** | Explosion progressive | 1 main |
| ✊ **Fermer poing** | Freeze temporaire | 1 main |

## 🎨 Interface

### HUD (Haut Gauche)
- Barres **ROT X/Y** : Affiche la rotation
- Barre **ZOOM** : Affiche le zoom
- Barre **EXPLODE** : Niveau d'explosion (0-100%)
- Indicateur **FREEZE** : Apparaît lors du gel

### Webcam PiP (Bas Droite)
- **Bouton 📹** : Activer/Désactiver la webcam
- **Fenêtre LIVE** : Aperçu en temps réel
- **Bouton ✕** : Fermer la fenêtre

## ⚡ Optimisation

### Performances Réduites
Si l'application est lente :
```python
# Dans gestures_server.py
FPS_LIMIT = 20           # Réduire à 20 FPS
PREVIEW_EVERY = 6        # Réduire fréquence preview
```

### Sensibilité Ajustée
Pour des gestes plus précis :
```python
# Dans gestures_server.py
ROT_GAIN = 0.004         # Réduire sensibilité rotation
ZOOM_GAIN = 0.001        # Réduire sensibilité zoom
```

### Stabilité Accrue
Pour éliminer davantage de tremblements :
```python
# Dans gestures_server.py
ROT_DEADZONE = 0.006     # Augmenter deadzone
SMOOTH = 0.8             # Augmenter lissage (max 0.95)
```

## 🐛 Problèmes Courants

### ❌ Webcam non détectée
```python
# Essayer un autre index de caméra
cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)  # Essayer 1, 2, etc.
```

### ❌ Gestes non détectés
- Vérifier l'éclairage (bien éclairé)
- Distance idéale : 40-80 cm de la caméra
- Mains bien visibles, doigts écartés

### ❌ Port WebSocket occupé
```bash
# Windows : Tuer le processus sur le port 8765
netstat -ano | findstr :8765
taskkill /PID <PID> /F
```

### ❌ Modèle 3D non chargé
- Placez votre fichier STL dans `/public/models/model.stl`
- Un cube de fallback s'affiche si absent (normal)

## 📊 Indicateurs de Santé

### Serveur Python
✅ `[WS] listening` = Serveur actif  
✅ Pas d'erreurs MediaPipe = Détection OK

### Interface Web
✅ Console : `[WS] connected` = Connexion établie  
✅ HUD visible = Composants chargés  
✅ Barres bougent = Données reçues

## 🎯 Première Utilisation

1. **Calibrer** : Placez-vous devant la caméra
2. **Tester rotation** : Levez UNE main, bougez le poignet gauche/droite
3. **Tester zoom** : Pincement (pouce+index) avec les DEUX mains
   - ÉCARTER les mains = ZOOM AVANT (modèle s'approche)
   - RAPPROCHER les mains = ZOOM ARRIÈRE (modèle s'éloigne)
4. **Tester explosion** : Levez l'index
5. **Tester freeze** : Fermez le poing

## 💡 Astuces

- **Mouvements lents** : Plus précis et stables
- **Mains stables** : Posez les coudes sur une surface
- **Éclairage optimal** : Éviter contre-jour
- **Distance constante** : Ne pas trop s'approcher/éloigner

---

**Prêt à démarrer ?** Lancez les deux commandes et faites un geste ! 🎮
