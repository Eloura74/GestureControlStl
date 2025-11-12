# 🔄 Migration de V1 à V2

Guide pas à pas pour migrer votre installation V1 vers V2 ultra-optimisée.

---

## ⚡ Résumé des Changements

| Aspect | V1 | V2 |
|--------|----|----|
| **Backend** | WebSocket simple | FastAPI + WS + API REST |
| **Stabilisation** | Lissage basique | Kalman + FSM + Deadzone adaptive |
| **Config** | Hardcodé Python | TOML centralisé |
| **Protocole** | JSON simple | Messages versionnés v2 |
| **Frontend** | Matériau standard | Shader Fresnel custom |
| **Profils** | Unique | 3 profils (Précis/Équilibré/Réactif) |
| **Reconnexion** | Manuelle | Automatique exponentielle |
| **Latence** | ~60ms | ~40ms |
| **Stabilité** | Bonne | Excellente (Kalman) |

---

## 📦 Étape 1 : Installation des Nouvelles Dépendances

### Python

```bash
# Activer venv
.venv310\Scripts\activate

# Installer dépendances V2
pip install -r requirements_v2.txt

# Ou manuellement
pip install fastapi uvicorn toml
```

### Node.js (Inchangé)

Pas de nouvelles dépendances côté frontend.

---

## ⚙️ Étape 2 : Configuration

### Créer/Éditer `config.toml`

Le fichier existe déjà avec des valeurs par défaut.

**Vérifiez** :
```toml
[gestures]
profile = "balanced"  # Profil actif

[gestures.profiles.balanced]
rot_gain = 2.0        # Même valeur que votre gestures_server.py
zoom_gain = 0.5
smooth = 0.5

[camera]
index = 0             # Votre index de caméra
profile = "medium"    # Résolution 640×360 @ 30 FPS

[kalman]
enabled = true        # Activer Kalman (recommandé)
```

### Migrer Vos Paramètres V1

Si vous avez modifié `gestures_server.py`, reportez vos valeurs :

```python
# gestures_server.py V1
ROT_GAIN = 2.0
ZOOM_GAIN = 0.5
SMOOTH = 0.5

# Devient dans config.toml V2
[gestures.profiles.balanced]
rot_gain = 2.0
zoom_gain = 0.5
smooth = 0.5
```

---

## 🚀 Étape 3 : Tester la V2

### Option A : Backend V2 (Recommandé)

```bash
# Terminal 1 : Serveur V2
python server_v2.py

# Terminal 2 : Frontend V2
npm run dev
```

**Ouvrir** : http://localhost:5173

**Points de contrôle** :
- ✅ Badge "État" en haut à droite
- ✅ Sélecteur de profils en bas à droite
- ✅ HUD affiche "V2.0 | Kalman+FSM"
- ✅ Shader Fresnel (effet de bord lumineux)

### Option B : Tester sans changer V1

Garder V1 en parallèle :

```bash
# V1 (ancien serveur)
python gestures_server.py  # Port 8765

# V2 (nouveau serveur sur autre port)
# Éditez config.toml : port = 8766
python server_v2.py        # Port 8766
```

**Frontend** : Changez `WS_URL` dans `AppV2.jsx` selon le port.

---

## 🎨 Étape 4 : Activer le Frontend V2

### Méthode 1 : Remplacer main.jsx

```bash
# Sauvegarder V1
copy src\main.jsx src\main_v1.jsx.bak

# Éditer src/main.jsx
```

**Remplacer** :
```jsx
// V1
import App from './App.jsx'

// V2
import App from './AppV2.jsx'
```

### Méthode 2 : Build séparé

Créer un point d'entrée V2 :

```jsx
// src/main_v2.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import AppV2 from './AppV2.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppV2 />
  </React.StrictMode>,
)
```

Puis dans `package.json` :
```json
"scripts": {
  "dev": "vite",
  "dev:v2": "vite --mode v2",
  "build:v2": "vite build --mode v2"
}
```

---

## 🧪 Étape 5 : Vérification

### Tests Backend V2

```bash
# Test 1 : Health check
curl http://localhost:8765/api/health

# Devrait retourner :
# {"status":"ok","version":"2.0.0","clients":0,"mode":"IDLE"}

# Test 2 : Configuration
curl http://localhost:8765/api/config

# Test 3 : Changer profil
curl -X POST http://localhost:8765/api/config/profile/reactive

# Test 4 : Stats FSM
curl http://localhost:8765/api/stats
```

### Tests Frontend V2

**Console (F12)** :
```
✅ [WS] Connecté au serveur V2
```

**HUD** :
- Footer affiche "V2.0 | Kalman+FSM"
- Mode FSM visible (IDLE/ROTATE/ZOOM/etc.)

**Badge État** (haut-droite) :
- Affiche mode actuel
- Change de couleur selon mode

**Profils** (bas-droite) :
- Clic ouvre menu
- 3 profils disponibles
- Touche `G` pour cycler

---

## 🎯 Étape 6 : Comparaison Performances

### Test de Stabilité

**V1** :
```bash
python calibration.py
# Notez les valeurs ROT_X, ROT_Y
```

**V2** :
```bash
# Lancer V2
python server_v2.py

# Comparer dans le HUD frontend
# Les valeurs devraient être plus stables
```

### Mesure de Latence

**Console navigateur (F12)** :
```javascript
// V2 ajoute timestamp
let lastTS = 0;
window.addEventListener('holo:hud', (e) => {
  const msg = e.detail;
  // Latence affichée dans les logs
});
```

---

## 🔧 Étape 7 : Personnalisation V2

### Créer un Profil Custom

**Dans `config.toml`** :
```toml
[gestures.profiles.myprofile]
rot_gain = 2.5
zoom_gain = 0.6
smooth = 0.4
rot_deadzone = 0.0001
zoom_deadzone = 0.003
pinch_threshold = 0.08

[gestures]
profile = "myprofile"  # Activer
```

**Redémarrer** `server_v2.py`.

### Désactiver Kalman (si problème)

```toml
[kalman]
enabled = false
```

### Ajuster FSM (temps de maintien)

```toml
[fsm]
dwell_rotate = 50     # Plus réactif (défaut: 80)
dwell_zoom = 50
dwell_explode = 80
dwell_idle = 100
```

---

## ⚠️ Problèmes Courants

### Erreur "Module 'fastapi' not found"

```bash
pip install fastapi uvicorn
```

### Erreur "Module 'toml' not found"

```bash
pip install toml
```

### Le frontend ne se connecte pas

**Vérifiez** :
1. `server_v2.py` est lancé ?
2. Port correct dans `AppV2.jsx` (ligne 11) ?
3. Console (F12) affiche erreur ?

### Les gestes sont moins réactifs qu'avant

**Option 1** : Passer au profil "reactive"
```bash
curl -X POST http://localhost:8765/api/config/profile/reactive
```

**Option 2** : Réduire smooth dans config.toml
```toml
smooth = 0.3  # Plus réactif (défaut: 0.5)
```

### Le shader Fresnel ne s'affiche pas

**Fallback automatique** : Si WebGL ne supporte pas les shaders customs, un matériau standard est utilisé.

Vérifiez dans la console (F12) si erreurs de shader.

---

## 🔄 Revenir à V1

Si vous voulez revenir à V1 :

### Backend

```bash
# Relancer l'ancien serveur
python gestures_server.py
```

### Frontend

```jsx
// src/main.jsx
import App from './App.jsx'  // Au lieu de AppV2.jsx
```

**Ou** garder les deux :
```bash
# V1 sur port 8765
python gestures_server.py

# V2 sur port 8766 (éditer config.toml)
python server_v2.py
```

Et changer `WS_URL` dans le code selon besoin.

---

## 📊 Tableau de Migration

| Fichier | Action | Priorité |
|---------|--------|----------|
| `config.toml` | ✅ Créer/éditer | **Haute** |
| `requirements_v2.txt` | ✅ Installer | **Haute** |
| `server_v2.py` | 🆕 Nouveau serveur | **Haute** |
| `core/kalman.py` | 🆕 Filtre Kalman | Moyenne |
| `core/fsm.py` | 🆕 Machine à états | Moyenne |
| `core/config.py` | 🆕 Gestionnaire config | Moyenne |
| `src/AppV2.jsx` | 🆕 Frontend V2 | **Haute** |
| `src/components/StateBadge.jsx` | 🆕 Badge état | Basse |
| `src/components/ProfileSelector.jsx` | 🆕 Sélecteur profils | Basse |
| `src/main.jsx` | ✏️ Modifier import | **Haute** |
| `gestures_server.py` | ⚠️  Garder (backup V1) | - |
| `src/App.jsx` | ⚠️  Garder (backup V1) | - |

---

## ✅ Checklist de Migration

- [ ] Dépendances Python installées (`pip install -r requirements_v2.txt`)
- [ ] `config.toml` créé et édité
- [ ] `server_v2.py` lance sans erreur
- [ ] API REST fonctionne (`curl http://localhost:8765/api/health`)
- [ ] Frontend V2 se connecte (badge "✅ Connecté")
- [ ] HUD affiche "V2.0 | Kalman+FSM"
- [ ] Badge d'état visible (haut-droite)
- [ ] Sélecteur de profils fonctionne (bas-droite)
- [ ] Shader Fresnel appliqué (effet de bord lumineux)
- [ ] Gestes stables (Kalman actif)
- [ ] FSM transitions fluides
- [ ] Hotkeys fonctionnent (R, E, G)

---

## 🎓 Ressources

- `README_V2.md` - Documentation complète V2
- `DIAGNOSTIC.md` - Guide dépannage
- `config.toml` - Fichier de config (commenté)
- `core/*.py` - Modules testables indépendamment

---

## 🚀 Prochaines Étapes

Une fois V2 stable :

1. **Tester tous les profils** (G pour cycler)
2. **Ajuster gains** dans `config.toml`
3. **Mesurer performances** (Stats API)
4. **Activer/désactiver Kalman** selon préférence
5. **Créer profil custom** pour votre usage

---

**Bonne migration vers V2 ! 🎉**

Si problème, consultez `DIAGNOSTIC.md` ou revenez à V1 temporairement.
