# 📑 Holo-Control V2.0 - Index de Navigation

Point d'entrée centralisé pour toute la documentation et les fichiers V2.

---

## 🚀 Démarrage Rapide

**Nouveau utilisateur ?** → **[QUICKSTART_V2.md](QUICKSTART_V2.md)**  
Installation et lancement en 5 minutes.

**Migration V1→V2 ?** → **[MIGRATION_V1_TO_V2.md](MIGRATION_V1_TO_V2.md)**  
Guide pas à pas pour migrer.

**Problème ?** → **[DIAGNOSTIC.md](DIAGNOSTIC.md)**  
Dépannage et solutions.

---

## 📚 Documentation Principale

### 📖 Guides Utilisateur

| Document | Description | Niveau |
|----------|-------------|--------|
| **[QUICKSTART_V2.md](QUICKSTART_V2.md)** | Démarrage express (5 min) | 🟢 Débutant |
| **[README_V2.md](README_V2.md)** | Documentation complète V2.0 | 🟡 Intermédiaire |
| **[GESTES.md](GESTES.md)** | Guide détaillé des gestes | 🟢 Débutant |

### 🔧 Guides Techniques

| Document | Description | Niveau |
|----------|-------------|--------|
| **[V2_SUMMARY.md](V2_SUMMARY.md)** | Résumé technique implémentation | 🔴 Avancé |
| **[MIGRATION_V1_TO_V2.md](MIGRATION_V1_TO_V2.md)** | Migration V1→V2 | 🟡 Intermédiaire |
| **[DIAGNOSTIC.md](DIAGNOSTIC.md)** | Dépannage et debug | 🟡 Intermédiaire |

### 📋 Documents Legacy (V1)

| Document | Description | Statut |
|----------|-------------|--------|
| **[README.md](README.md)** | Documentation V1 | ⚠️ Legacy |
| **[CHANGELOG.md](CHANGELOG.md)** | Historique V1 | ⚠️ Legacy |
| **[QUICKSTART.md](QUICKSTART.md)** | Démarrage V1 | ⚠️ Legacy |

---

## 💻 Code Source

### 🐍 Backend V2

| Fichier | Description | Type |
|---------|-------------|------|
| **[server_v2.py](server_v2.py)** | Serveur FastAPI + WS + Kalman + FSM | 🆕 Principal |
| **[core/kalman.py](core/kalman.py)** | Filtre de Kalman 1D/2D | 🆕 Module |
| **[core/fsm.py](core/fsm.py)** | Machine à États (FSM) | 🆕 Module |
| **[core/config.py](core/config.py)** | Gestionnaire configuration | 🆕 Module |
| **[gestures_server.py](gestures_server.py)** | Serveur simple V1 | ⚠️ Legacy |

### ⚛️ Frontend V2

| Fichier | Description | Type |
|---------|-------------|------|
| **[src/AppV2.jsx](src/AppV2.jsx)** | App V2 avec shader Fresnel | 🆕 Principal |
| **[src/components/StateBadge.jsx](src/components/StateBadge.jsx)** | Badge état FSM | 🆕 Composant |
| **[src/components/ProfileSelector.jsx](src/components/ProfileSelector.jsx)** | Sélecteur profils | 🆕 Composant |
| **[src/components/GesturesHUDV2.jsx](src/components/GesturesHUDV2.jsx)** | HUD V2 | 🆕 Composant |
| **[src/App.jsx](src/App.jsx)** | App V1 | ⚠️ Legacy |

### ⚙️ Configuration

| Fichier | Description | Type |
|---------|-------------|------|
| **[config.toml](config.toml)** | Configuration centrale V2 | 🆕 Config |
| **[requirements_v2.txt](requirements_v2.txt)** | Dépendances Python V2 | 🆕 Config |

### 🧪 Outils

| Fichier | Description | Type |
|---------|-------------|------|
| **[calibration.py](calibration.py)** | Outil de calibration visuel | 🔧 Outil |
| **[test_gestures.py](test_gestures.py)** | Test des gestes (V1) | 🔧 Outil |

---

## 🎯 Workflows Recommandés

### 📥 Première Installation

```
1. QUICKSTART_V2.md          # Installer et lancer
2. Tester avec 3 profils     # G pour cycler
3. README_V2.md (optionnel)  # Approfondir
```

### 🔄 Migration V1→V2

```
1. MIGRATION_V1_TO_V2.md     # Suivre étapes
2. config.toml               # Adapter paramètres V1
3. Comparer V1 vs V2         # Lancer en parallèle
4. V2_SUMMARY.md             # Comprendre architecture
```

### 🐛 Dépannage

```
1. DIAGNOSTIC.md             # Suivre diagnostic
2. calibration.py            # Vérifier détection
3. Logs serveur              # python server_v2.py
4. Console navigateur        # F12
```

### ⚙️ Personnalisation

```
1. config.toml               # Éditer profils
2. README_V2.md              # Section configuration
3. Redémarrer serveur        # Appliquer changements
```

---

## 📊 Comparaison V1 vs V2

| Fonctionnalité | V1 | V2 | Doc |
|----------------|----|----|-----|
| **Serveur** | WebSocket simple | FastAPI + API REST | [server_v2.py](server_v2.py) |
| **Stabilisation** | Lissage basique | Kalman + FSM | [core/kalman.py](core/kalman.py) |
| **Configuration** | Code Python | TOML centralisé | [config.toml](config.toml) |
| **Profils** | 1 fixe | 3 changeables | [ProfileSelector.jsx](src/components/ProfileSelector.jsx) |
| **Shader** | Matériau standard | Fresnel custom | [AppV2.jsx](src/AppV2.jsx) |
| **Reconnexion** | Manuelle | Automatique | [AppV2.jsx](src/AppV2.jsx) |
| **API** | Aucune | 4 endpoints | [README_V2.md](README_V2.md#api-rest) |
| **Badge état** | Non | Oui (FSM) | [StateBadge.jsx](src/components/StateBadge.jsx) |

---

## 🔗 Liens Rapides

### API Endpoints (Backend lancé)

- **Santé** : http://localhost:8765/api/health
- **Configuration** : http://localhost:8765/api/config
- **Stats FSM** : http://localhost:8765/api/stats
- **Interface** : http://localhost:5173

### Commandes Utiles

```bash
# Backend V2
python server_v2.py

# Frontend
npm run dev

# Test Kalman
python core/kalman.py

# Test FSM
python core/fsm.py

# Changer profil
curl -X POST http://localhost:8765/api/config/profile/reactive
```

---

## 📦 Structure Complète

```
holo-control/
│
├── 📚 DOCUMENTATION V2
│   ├── INDEX_V2.md              ← Vous êtes ici
│   ├── QUICKSTART_V2.md         ← Démarrage express
│   ├── README_V2.md             ← Doc complète
│   ├── MIGRATION_V1_TO_V2.md    ← Guide migration
│   ├── V2_SUMMARY.md            ← Résumé technique
│   ├── DIAGNOSTIC.md            ← Dépannage
│   └── GESTES.md                ← Guide gestes
│
├── 🐍 BACKEND V2
│   ├── server_v2.py             ← FastAPI + Kalman + FSM
│   ├── core/
│   │   ├── kalman.py
│   │   ├── fsm.py
│   │   └── config.py
│   ├── config.toml              ← Configuration centrale
│   └── requirements_v2.txt
│
├── ⚛️ FRONTEND V2
│   ├── src/
│   │   ├── AppV2.jsx
│   │   └── components/
│   │       ├── StateBadge.jsx
│   │       ├── ProfileSelector.jsx
│   │       └── GesturesHUDV2.jsx
│   └── public/models/
│
└── 🔧 OUTILS
    ├── calibration.py
    └── test_gestures.py
```

---

## ❓ FAQ Rapide

### Q: Par où commencer ?

**R:** [QUICKSTART_V2.md](QUICKSTART_V2.md) pour installation et lancement.

### Q: Je viens de V1, que faire ?

**R:** [MIGRATION_V1_TO_V2.md](MIGRATION_V1_TO_V2.md) pour migrer pas à pas.

### Q: Comment changer la sensibilité ?

**R:** Éditer `config.toml` section `[gestures.profiles.balanced]` puis redémarrer serveur.

### Q: Les gestes sont instables ?

**R:** 
1. Vérifier que Kalman est activé (`config.toml` → `[kalman] enabled = true`)
2. Passer au profil "précis" (touche `G`)
3. Consulter [DIAGNOSTIC.md](DIAGNOSTIC.md)

### Q: Comment tester si Kalman fonctionne ?

**R:** `python core/kalman.py` génère un graphique de test.

### Q: L'API REST ne répond pas ?

**R:** Vérifier que `server_v2.py` est lancé (pas `gestures_server.py`).

---

## 🎓 Parcours d'Apprentissage

### 🟢 Niveau Débutant

1. [QUICKSTART_V2.md](QUICKSTART_V2.md) - Installation
2. [GESTES.md](GESTES.md) - Apprendre les gestes
3. Tester les 3 profils (touche G)

### 🟡 Niveau Intermédiaire

4. [README_V2.md](README_V2.md) - Fonctionnalités complètes
5. [config.toml](config.toml) - Personnaliser
6. [DIAGNOSTIC.md](DIAGNOSTIC.md) - Dépanner

### 🔴 Niveau Avancé

7. [V2_SUMMARY.md](V2_SUMMARY.md) - Architecture
8. [core/kalman.py](core/kalman.py) - Comprendre Kalman
9. [core/fsm.py](core/fsm.py) - Comprendre FSM
10. [server_v2.py](server_v2.py) - Code serveur

---

## 🆘 Support

### Problème d'Installation

→ [QUICKSTART_V2.md](QUICKSTART_V2.md) section "Problèmes Rapides"

### Problème de Gestes

→ [DIAGNOSTIC.md](DIAGNOSTIC.md) section "Diagnostics par Symptôme"

### Migration V1→V2

→ [MIGRATION_V1_TO_V2.md](MIGRATION_V1_TO_V2.md)

### Comprendre l'Architecture

→ [V2_SUMMARY.md](V2_SUMMARY.md)

---

## 📈 Roadmap

### V2.1 (Proche)
- Panneau stats FPS/latence
- Export/import config
- Calibration assistée UI

### V2.5 (Moyen terme)
- Support GLB/Draco
- Explosé multi-pièces
- Postprocessing bloom

### V3.0 (Long terme)
- Binaire Tauri
- ML adaptatif
- Gestes avancés

---

## 📄 Licence

MIT License - Libre d'utilisation et modification.

---

## 🎉 Conclusion

**Vous êtes ici** → Parfait point de départ !

**Commencez par** :
1. [QUICKSTART_V2.md](QUICKSTART_V2.md) si nouveau
2. [MIGRATION_V1_TO_V2.md](MIGRATION_V1_TO_V2.md) si migration
3. [DIAGNOSTIC.md](DIAGNOSTIC.md) si problème

**Documentation complète** : [README_V2.md](README_V2.md)

---

**Bonne découverte de Holo-Control V2.0 ! 🚀✨**

*Dernière mise à jour : V2.0.0*
