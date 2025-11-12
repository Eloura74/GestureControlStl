# 🔍 Guide de Diagnostic - Holo-Control

## 🎯 Problème: Aucun Mouvement Détecté

Ce guide vous aide à diagnostiquer pourquoi les gestes ne fonctionnent pas.

---

## 📋 Étape 1 : Script de Calibration

### Lancer le script de calibration

```bash
# Activer venv
.venv310\Scripts\activate

# Lancer calibration
python calibration.py
```

### Ce que vous devez voir

✅ **Fenêtre vidéo** avec :
- Squelettes des mains en vert/rouge
- Informations en temps réel sur la gauche
- Valeurs ROT_X, ROT_Y, ZOOM affichées

✅ **Pour la ROTATION** (1 main) :
```
=== MODE ROTATION ===
Poignet: (0.xxx, 0.xxx)
Delta brut: dx=0.xxxxx, dy=0.xxxxx
Deadzone active: True/False
Velocite: vx=0.xxxxx, vy=0.xxxxx
ROT_X: 0.xxxxxx
ROT_Y: 0.xxxxxx
>>> MOUVEMENT DETECTE <<<  (si ça bouge)
```

✅ **Pour le ZOOM** (2 mains) :
```
=== MODE ZOOM ===
Main 1: PINCE (dist=0.xxx)  ← doit être VERT
Main 2: PINCE (dist=0.xxx)  ← doit être VERT
PINCEMENT ACTIF!
Distance mains: 0.xxxx
Diff: 0.xxxxx (avg=0.xxxx)
Deadzone OK: True
Direction: ECARTER (zoom+) ou RAPPROCHER (zoom-)
ZOOM_DELTA: 0.xxxxxx
>>> ZOOM DETECTE <<<
```

### Résultat

En bas de l'écran, vous verrez :
```
ENVOI: ROT_X=0.xxxx | ROT_Y=0.xxxx | ZOOM=0.xxxx
```

**Si tout est à 0.0000** → Problème de détection
**Si des valeurs apparaissent** → La détection fonctionne !

---

## 📋 Étape 2 : Vérifier le Serveur Python

### Lancer avec logs

```bash
# Activer venv
.venv310\Scripts\activate

# Lancer serveur
python gestures_server.py
```

### Ce que vous devez voir au démarrage

```
============================================================
🎮 HOLO-CONTROL SERVEUR DE GESTES
============================================================

📡 WebSocket: ws://127.0.0.1:8765
🎯 FPS Limit: 30
🐛 Debug Mode: ✅ ACTIF

⚙️  Configuration:
  ROT_GAIN      = 0.015
  ZOOM_GAIN     = 0.008
  SMOOTH        = 0.6
  ROT_DEADZONE  = 0.002
  ZOOM_DEADZONE = 0.01

🎮 Gestes:
  - 1 MAIN: Rotation du modèle
  - 2 MAINS en pincement: Zoom
  - Index levé: Explosion
  - Poing fermé: Freeze

============================================================
✅ Serveur démarré ! En attente de connexions...
```

### Logs pendant l'utilisation (toutes les 30 frames)

```
📊 [Frame 30] État des gestes:
  👐 Mains détectées: 1
  🔄 Rotation: rot_dx=0.003245, rot_dy=-0.001234
  🔍 Zoom: zoom_delta=0.000000
  💥 Explode: 0.00
  ❄️  Freeze: False
  📡 Clients connectés: 1
  ✅ Mouvement détecté: True
```

**Si "Mouvement détecté: False"** tout le temps → Problème de gestes
**Si "Clients connectés: 0"** → Le navigateur n'est pas connecté

---

## 📋 Étape 3 : Vérifier le Navigateur

### Ouvrir la Console (F12)

Dans Chrome/Edge : `F12` > onglet **Console**

### Ce que vous devez voir

Au chargement :
```
✅ [WS] Connecté au serveur
🎮 En attente des données de gestes...
```

Pendant l'utilisation (toutes les 30 messages) :
```
📊 [Message 30] Données reçues:
  🔄 Rotation: rot_dx=0.003245, rot_dy=-0.001234
  🔍 Zoom: zoom_delta=0.000000
  💥 Explode: 0.00
  ❄️  Freeze: false
  ✅ Mouvement: OUI
```

### Erreurs possibles

❌ **"Connexion fermée"** → Le serveur Python n'est pas lancé
❌ **"Erreur parsing message"** → Problème de format des données
❌ **Aucun message** → Problème de WebSocket

---

## 🔧 Diagnostics par Symptôme

### Symptôme 1 : "Aucun mouvement détecté" dans calibration.py

**Cause** : Deadzones trop hautes ou mains non détectées

**Solution** :
1. Vérifiez que vos mains sont bien visibles (squelettes verts)
2. Bougez plus amplement le poignet
3. Pour le zoom, rapprochez BIEN pouce et index (< 8cm)

**Réglage temporaire** :
```python
# Dans calibration.py, modifiez :
config = {
    "ROT_DEADZONE": 0.0001,  # Presque rien
    "ZOOM_DEADZONE": 0.001,  # Très bas
    "PINCH_THRESHOLD": 0.12  # Plus tolérant
}
```

### Symptôme 2 : Calibration fonctionne, mais pas le serveur

**Cause** : Configuration différente entre calibration et serveur

**Solution** : Copiez les valeurs qui marchent dans `gestures_server.py`

### Symptôme 3 : Serveur détecte, mais rien dans le navigateur

**Cause** : WebSocket non connecté

**Vérifications** :
1. Console navigateur : `✅ [WS] Connecté` ?
2. Serveur Python : `📡 Clients connectés: 1` ?
3. Même port ? (8765)

### Symptôme 4 : Navigateur reçoit des données, mais modèle ne bouge pas

**Cause** : Problème d'application des rotations/zoom

**Vérifications** :
1. Console navigateur : "Mouvement: OUI" ?
2. Les valeurs sont-elles trop petites ?
3. Le modèle STL s'est-il chargé ? (Frame_Bolt au lieu du cube)

**Solution temporaire** : Augmenter les gains
```python
# Dans gestures_server.py
ROT_GAIN = 0.030   # Double
ZOOM_GAIN = 0.015  # Double
```

---

## 📊 Tableau de Diagnostic

| État | Calibration | Serveur Logs | Console Navigateur | Mouvement | Action |
|------|-------------|--------------|-------------------|-----------|---------|
| ✅ | Détecte | Détecte | Reçoit | ❌ NON | Augmenter gains |
| ✅ | Détecte | Détecte | ❌ Aucun msg | ❌ NON | Vérifier WebSocket |
| ✅ | Détecte | ❌ Rien | - | ❌ NON | Relancer serveur |
| ❌ | Rien | - | - | ❌ NON | Problème caméra/mains |

---

## 🎯 Configuration Recommandée

### Pour des mouvements TRÈS visibles (test)

```python
# gestures_server.py
ROT_GAIN = 0.030          # Triple sensibilité
ZOOM_GAIN = 0.015         # Double sensibilité
SMOOTH = 0.4              # Plus réactif
ROT_DEADZONE = 0.0001     # Presque aucune deadzone
ZOOM_DEADZONE = 0.001     # Très réactif
```

⚠️ **Attention** : Ces valeurs sont volontairement excessives pour le diagnostic.
Une fois que ça marche, réduisez progressivement pour plus de stabilité.

---

## 📝 Fichiers de Log

### Calibration

Après avoir quitté `calibration.py` (touche Q), un fichier est créé :
```
calibration_log_YYYYMMDD_HHMMSS.json
```

Contient :
- Configuration utilisée
- Logs des 100 dernières frames
- Statistiques de détection

### Utilisation

Ouvrez avec un éditeur de texte pour analyser les valeurs.

---

## 🆘 Problèmes Communs

### Caméra non détectée

```bash
# Tester avec un autre index
# Dans calibration.py ou gestures_server.py :
cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)  # Essayer 1, 2, 3...
```

### Mains non détectées

- ✅ Éclairage suffisant (pas de contre-jour)
- ✅ Mains bien visibles dans le cadre
- ✅ Distance : 40-80cm de la caméra
- ✅ Arrière-plan pas trop chargé

### Pincement non détecté

- ✅ Pouce et index VRAIMENT proches (quelques mm)
- ✅ Autres doigts peuvent être ouverts ou fermés
- ✅ Dans `calibration.py`, regardez "dist=" → doit être < 0.08

### WebSocket ne se connecte pas

```bash
# Vérifier que le port n'est pas utilisé
netstat -ano | findstr :8765

# Tuer le processus si besoin
taskkill /PID <PID> /F
```

---

## ✅ Checklist Complète

Avant de demander de l'aide :

- [ ] `calibration.py` lancé → Détection fonctionne ?
- [ ] Serveur Python lancé → Logs apparaissent ?
- [ ] Console navigateur ouverte (F12) → Messages reçus ?
- [ ] Gains augmentés temporairement → Ça bouge ?
- [ ] Modèle STL chargé → Frame_Bolt ou cube ?
- [ ] Fichiers de log sauvegardés → Prêt à partager

---

**Bon diagnostic ! 🔍**
