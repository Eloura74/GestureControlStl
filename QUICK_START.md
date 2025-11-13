# ⚡ Quick Start Guide - Holo-Control V3.1 Premium

## 🚀 Démarrage en 3 minutes

### 1️⃣ Installation (première fois uniquement)

```bash
# Dans le dossier holo-control/

# Backend Python
pip install -r requirements_v2.txt

# Frontend Node.js
npm install
```

### 2️⃣ Lancement

**Windows** :
```bash
start_v3.bat
```

**Manuel** :
```bash
# Terminal 1
python server_v3.py

# Terminal 2
npm run dev
```

### 3️⃣ Ouverture

Navigateur → [http://localhost:5173](http://localhost:5173)

---

## 🎮 Utilisation immédiate

### Interface V3.1

```
┌─────────────────────────────────────────────────────┐
│  [●] ONLINE    [ROTATE]  📹 ❄️ 🎯PRE 💥  FPS⚡ [STOP] │ ← HoloControlBar
└─────────────────────────────────────────────────────┘

                    ┌──────┐
                    │  ↻   │  ← GestureIndicator
                    │ROTATE│     (centre écran)
                    └──────┘

                       👻     ← GhostReticule
                              (suit la main)
```

### Gestes supportés

| Geste | Action | Icône |
|-------|--------|-------|
| 🤚 **1 main ouverte** | Rotation 3D | ↻ |
| ✌️ **2 mains pincement** | Zoom avant/arrière | 🔍 |
| ☝️ **Index levé** | Explosion modèle | 💥 |
| ✊ **Poing fermé** | Freeze (pause) | ❄️ |

### Raccourcis clavier

| Touche | Action |
|--------|--------|
| `R` | Reset caméra |
| `E` | Toggle explosion |
| `G` | Changer profil |

---

## 🎨 Nouveautés V3.1 en un coup d'œil

### ✨ HoloControlBar (barre du haut)
- **Status WebSocket** : ● (vert = connecté)
- **Mode actuel** : Badge coloré (ROTATE/ZOOM/etc.)
- **Bouton webcam** : 📹 toggle aperçu
- **Profil** : 🎯 Précis / ⚖️ Équilibré / ⚡ Réactif
- **Metrics** : FPS + latence en temps réel
- **Stop** : Arrêt serveur propre

### 🎯 GestureIndicator (centre)
- Affiche **l'icône du geste actif**
- Animation spécifique par geste :
  - ROTATE : Rotation 360°
  - ZOOM : Pulsation scale
  - EXPLODE : Burst explosif
  - FREEZE : Anneau statique
- **Disparaît automatiquement** après 2s en IDLE

### 👻 GhostReticule (main)
- **Réticule 3D** qui suit votre main
- Centre + 2 anneaux pulsants
- Trail effect en rotation
- Particules en explosion

### 🎨 Shaders Premium
- **Arc-en-ciel holographique** subtil
- **Arcs électriques** style Star Wars
- **Glitch occasionnel** pour réalisme
- **Edge highlights** Tron-style
- **Scan vertical** en mode IDLE

### 📏 Auto-Fit
- **Zoom automatique** selon taille STL
- Plus besoin d'ajuster manuellement
- Fonctionne pour tout modèle

---

## 📊 HoloControlBar - Guide complet

```
┌──────┬────────┬──────┬──────┬───────┬──────┬──────────┬──────┐
│ WS   │ MODE   │ 📹   │ ❄️   │ PROFIL│ 💥   │ FPS/LAT  │ STOP │
└──────┴────────┴──────┴──────┴───────┴──────┴──────────┴──────┘
   ↓       ↓       ↓      ↓       ↓      ↓        ↓        ↓
ONLINE  ROTATE  CAM ON FREEZE  BAL   EXPLODE  25fps    ARRÊT
                       (actif)               40ms    SERVEUR
```

### Couleurs des modes
- **IDLE** : Gris (aucun geste)
- **ROTATE** : Vert (rotation active)
- **ZOOM** : Bleu (zoom actif)
- **EXPLODE** : Orange (explosion)
- **FREEZE** : Jaune (pause)

---

## ⚙️ Configuration rapide

### Changer de profil gestuel

**Méthode 1** : Cliquer sur 🎯 dans HoloControlBar
**Méthode 2** : Appuyer sur `G`

### Profils disponibles

| Profil | Usage | Sensibilité | Stabilité |
|--------|-------|-------------|-----------|
| 🎯 **Précis** | Travail fin | Basse | ⭐⭐⭐⭐⭐ |
| ⚖️ **Équilibré** | Recommandé | Moyenne | ⭐⭐⭐⭐ |
| ⚡ **Réactif** | Démos | Haute | ⭐⭐⭐ |

### Désactiver des éléments

Éditer `src/AppV3_Premium.jsx` :

```jsx
return (
  <>
    <div ref={mountRef} />
    
    <HoloControlBar />           {/* Barre principale */}
    <GestureIndicator />          {/* Indicateur central */}
    <GhostReticule />             {/* Réticule main */}
    
    {/* Optionnels - Commenter si non souhaités */}
    <GesturesHUD />               {/* HUD détaillé */}
    <WebcamPiP />                 {/* Aperçu webcam */}
  </>
);
```

---

## 🐛 Problèmes fréquents

### ❌ "Cannot connect to WebSocket"

**Cause** : Backend non démarré
**Solution** :
```bash
python server_v3.py
```
Attendre `✅ WebSocket: ws://127.0.0.1:8765/ws`

### ❌ Webcam ne fonctionne pas

**Cause** : Permissions navigateur
**Solution** :
1. Chrome : `chrome://settings/content/camera`
2. Autoriser `localhost`
3. Recharger la page (F5)

### ❌ Gestes trop sensibles

**Solution** :
1. Cliquer profil dans HoloControlBar
2. Choisir **🎯 Précis**
3. Ou éditer `config.toml` :
   ```toml
   [gestures.profiles.balanced]
   rot_gain = 1.0  # Réduire de 2.0 → 1.0
   ```

### ❌ Performance faible (FPS < 20)

**Solution** :
1. Réduire qualité shader dans `ux-config.js`
2. Désactiver bloom :
   ```javascript
   performance: {
     bloom: { enabled: false }
   }
   ```
3. Mode minimal :
   ```javascript
   import { applyPreset } from './config/ux-config';
   applyPreset('minimal');
   ```

### ❌ Modèle trop petit/grand

**Solution** : Auto-fit activé par défaut !
Si problème persiste :
```javascript
// Dans three/utils.js
export function autoFitMesh(...) {
  // ...
  const optimalDistance = distance * 2.0; // Ajuster multiplicateur
}
```

---

## 📖 Documentation complète

Pour aller plus loin :

- **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)** → Documentation détaillée de toutes les fonctionnalités
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** → Configuration avancée et personnalisation
- **[CHANGELOG_V3.1.md](./CHANGELOG_V3.1.md)** → Liste complète des changements
- **[README.md](./README.md)** → Vue d'ensemble du projet

---

## 🎯 Workflow recommandé

### 1. Premier lancement
```bash
start_v3.bat
# Navigateur → localhost:5173
# Placer main devant webcam
# Tester rotation (1 main) / zoom (2 mains)
```

### 2. Ajuster sensibilité
```
Cliquer 🎯 dans HoloControlBar
Choisir Précis/Équilibré/Réactif
Tester gestes
```

### 3. Charger vos modèles
```
Placer fichiers .stl dans public/models/
Modifier AppV3_Premium.jsx ligne 164 :
  "/models/VotreModele.stl"
```

### 4. Personnaliser interface
```javascript
// src/config/ux-config.js
export const UX_CONFIG = {
  holoBar: { width: "90%" },     // Largeur barre
  gestureIndicator: { size: 150 }, // Taille indicateur
  // ... voir fichier complet
};
```

---

## 🚀 Prêt à utiliser !

Vous avez maintenant :
- ✅ Interface premium unifiée
- ✅ Feedback visuel immersif
- ✅ Shaders holographiques avancés
- ✅ Auto-fit intelligent
- ✅ Configuration flexible

**Bon contrôle gestuel holographique ! 🎮✨**

---

**Besoin d'aide ?** Consulter MIGRATION_GUIDE.md ou UX_IMPROVEMENTS.md

**Version** : V3.1.0 Premium  
**Status** : ✅ Production Ready
