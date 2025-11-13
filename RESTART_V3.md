# 🔄 REDÉMARRAGE V3.0 REQUIS

## ✅ Corrections Appliquées

### 1. Encodage UTF-8 Console Windows
- Logs emojis maintenant compatibles Windows
- Fini les `UnicodeEncodeError`

### 2. Frontend → AppV3
- `main.jsx` modifié pour charger **AppV3** au lieu de AppV2
- Protocol V3 maintenant compatible

---

## 🚀 Redémarrer MAINTENANT

### Étape 1 : Arrêter Backend

**Dans le terminal serveur** :
```
CTRL + C
```

### Étape 2 : Redémarrer Backend V3

```bash
python server_v3.py
```

**Logs attendus (AVEC emojis maintenant)** :
```
============================================================
🎮 HOLO-CONTROL V3.0 - ULTRA-OPTIMISÉ
============================================================
📡 WebSocket: ws://127.0.0.1:8765/ws
📊 Metrics: http://127.0.0.1:8765/api/metrics
🎯 Gesture Profile: balanced
🔧 Kalman Filter: ❌ Disabled
🤖 FSM: Active
🧵 Thread Capture: Dédié
============================================================
✅ Capture thread started: 640x360
✅ Processing loop started @ 30 FPS limit
```

### Étape 3 : Redémarrer Frontend

**Browser** : 
- `CTRL + Shift + R` (hard refresh)
- OU fermer + rouvrir `http://localhost:5173`

---

## ✅ Vérifications

### Console Browser

**AVANT (AppV2 - ERREUR)** :
```
⚠️  Protocol version mismatch: 3
```

**APRÈS (AppV3 - OK)** :
```
✅ [WS V3] Connecté au serveur V3.0
```

### Metrics Display

**Haut-droite de l'écran** :
```
🎯 FPS: 29.8    ⚡ 45.2ms    ● V3.0
```

**Si tu vois "● V3.0"** → Tout fonctionne ! ✅

### Webcam PiP

**Coin bas-droite** → Doit afficher webcam ✅

### Interaction Main

**Levez la main** → Pièce doit tourner ✅

---

## 🐛 Si Problèmes Persistent

### Logs Backend SANS emojis

**Si toujours `UnicodeEncodeError`** :

**Option 1** : Lancer avec redirection UTF-8
```bash
chcp 65001
python server_v3.py
```

**Option 2** : Variable d'environnement
```bash
set PYTHONIOENCODING=utf-8
python server_v3.py
```

### Frontend Toujours AppV2

**Vérifier cache** :
1. Browser DevTools (F12)
2. Application → Clear Storage
3. Reload

**Vérifier main.jsx** :
```javascript
import AppV3 from "./AppV3.jsx";  // ✅ Doit être V3
```

---

## 🎯 Résultat Attendu

### Backend Console
```
07:59:28 - INFO - 🎮 HOLO-CONTROL V3.0 - ULTRA-OPTIMISÉ
07:59:28 - INFO - ✅ Capture thread started: 640x360
07:59:28 - INFO - ✅ Processing loop started @ 30 FPS limit
INFO:     Application startup complete.
```

### Frontend Console (F12)
```
✅ [WS V3] Connecté au serveur V3.0
(Pas de "Protocol version mismatch")
```

### Visuel
- **Webcam PiP** : Visible bas-droite
- **Metrics** : `🎯 FPS: 29.8  ⚡ 45ms  ● V3.0` haut-droite
- **Pièce 3D** : Cyan holographique, tourne avec main

---

**Redémarre MAINTENANT et tout devrait fonctionner ! 🚀**
