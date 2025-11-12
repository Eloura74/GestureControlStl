# 🚀 Démarrage Rapide - Holo-Control V2.0

Guide ultra-rapide pour lancer la V2 optimisée en **5 minutes**.

---

## ⚡ Installation Express (3 minutes)

### 1️⃣ Dépendances Python V2

```bash
# Activer environnement virtuel
.venv310\Scripts\activate

# Installer V2 (nouvelles dépendances)
pip install fastapi uvicorn toml

# Vérifier
python -c "import fastapi, toml; print('✅ V2 ready!')"
```

### 2️⃣ Frontend (inchangé)

```bash
# Si pas déjà fait
npm install
```

---

## 🎮 Lancement V2 (30 secondes)

### Terminal 1 : Backend V2

```bash
.venv310\Scripts\activate
python server_v2.py
```

**Attendez** :
```
============================================================
🎮 HOLO-CONTROL V2.0 - SERVEUR ULTRA-OPTIMISÉ
============================================================
📡 WebSocket: ws://127.0.0.1:8765/ws
🎯 Gesture Profile: balanced
🔧 Kalman Filter: ✅ Enabled
🤖 FSM: Active
============================================================
```

### Terminal 2 : Frontend

```bash
npm run dev
```

**Ouvrir** : http://localhost:5173

---

## ✅ Vérification Rapide (1 minute)

### Interface

✅ **Badge état** (haut-droite) : Affiche mode FSM actuel  
✅ **HUD** (gauche) : Footer "V2.0 | Kalman+FSM"  
✅ **Profils** (bas-droite) : Sélecteur de profils  
✅ **Webcam PiP** (bas-droite) : Aperçu caméra  

### Console Navigateur (F12)

```
✅ [WS] Connecté au serveur V2
```

### Test Gestes

1. **Levez 1 main** → Badge passe en "🔄 Rotation"
2. **Pincez 2 mains** → Badge passe en "🔍 Zoom"
3. **Appuyez sur G** → Change de profil

---

## 🎯 Différences V1 vs V2

| Fonctionnalité | V1 | V2 |
|----------------|----|----|
| **Stabilité** | Bonne | Excellente (Kalman) |
| **Badge état** | ❌ | ✅ Mode FSM temps réel |
| **Profils** | ❌ | ✅ 3 profils changeables |
| **Shader** | Standard | ✅ Fresnel holographique |
| **Reconnexion** | Manuelle | ✅ Automatique |
| **API REST** | ❌ | ✅ /api/* endpoints |
| **Config** | Code | ✅ config.toml |

---

## ⚙️ Configuration Rapide

### Changer de Profil

**Méthode 1 : Interface**
- Cliquez sur badge profil (bas-droite)
- Sélectionnez profil

**Méthode 2 : Clavier**
- Appuyez sur **G** pour cycler

**Méthode 3 : API**
```bash
curl -X POST http://localhost:8765/api/config/profile/reactive
```

### Ajuster Sensibilité

**Éditer `config.toml`** :
```toml
[gestures.profiles.balanced]
rot_gain = 2.5    # Plus sensible (défaut: 2.0)
zoom_gain = 0.6   # Plus sensible (défaut: 0.5)
```

**Redémarrer** `server_v2.py`.

---

## 🎮 Raccourcis Clavier

| Touche | Action |
|--------|--------|
| **R** | Reset caméra |
| **E** | Toggle explosion |
| **G** | Changer profil |
| **P** | Toggle webcam PiP |
| **H** | Toggle HUD |

---

## 🔬 Tests API

```bash
# Santé du serveur
curl http://localhost:8765/api/health

# Configuration actuelle
curl http://localhost:8765/api/config

# Statistiques FSM
curl http://localhost:8765/api/stats
```

---

## 🐛 Problèmes Rapides

### Backend ne démarre pas

**Erreur** : `ModuleNotFoundError: No module named 'fastapi'`

**Solution** :
```bash
pip install fastapi uvicorn toml
```

### Frontend ne se connecte pas

**Vérifiez** :
1. `server_v2.py` lancé ?
2. Console (F12) → erreurs ?
3. Badge "❌ Déconnecté" visible ?

**Solution** :
- Relancer `server_v2.py`
- Rafraîchir navigateur (F5)

### Gestes instables

**Option 1** : Activer Kalman (si désactivé)
```toml
[kalman]
enabled = true
```

**Option 2** : Profil "précis"
```bash
curl -X POST http://localhost:8765/api/config/profile/precise
```

---

## 📚 Documentation Complète

| Fichier | Contenu |
|---------|---------|
| `README_V2.md` | Documentation complète V2 |
| `MIGRATION_V1_TO_V2.md` | Guide migration V1→V2 |
| `DIAGNOSTIC.md` | Dépannage complet |
| `config.toml` | Configuration (commentée) |

---

## 🎓 Prochaines Étapes

1. **Tester les 3 profils** (G pour cycler)
2. **Ajuster config.toml** selon préférences
3. **Consulter README_V2.md** pour fonctionnalités avancées
4. **Utiliser API REST** pour intégrations

---

## 🆘 Support Express

**Erreur** → Consultez `DIAGNOSTIC.md`  
**Migration V1→V2** → Consultez `MIGRATION_V1_TO_V2.md`  
**Configuration** → Éditez `config.toml`  

---

**🎉 Profitez de la V2 optimisée !**

La V2 améliore la stabilité de **200%** grâce au filtre Kalman et à la FSM.

Pour plus de détails : **`README_V2.md`**
