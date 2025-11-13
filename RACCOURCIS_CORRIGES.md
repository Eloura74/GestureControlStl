# ⌨️ RACCOURCIS CORRIGÉS - Conflits Résolus

## 🔴 Problèmes Identifiés & Corrigés

---

## 1️⃣ **Conflit Touche P**

### ❌ **Avant (PROBLÈME)**
- **P** = Performance Monitor
- **P** = Playback gestes enregistrés → **CONFLIT !**

### ✅ **Maintenant (CORRIGÉ)**

| Touche | Action | Description |
|--------|--------|-------------|
| **P** | Performance Monitor | Affiche FPS, latency, mode |
| **L** | **L**ecture/Playback | Rejoue les gestes enregistrés |
| **N** | **N**ouveau Record | Démarre enregistrement |
| **K** | **K**ill/Stop | Arrête record/playback |
| **Space** | Pause | Met en pause le playback |

**Changements :**
- Play : **P → L** (Lecture)
- Stop : **M → K** (car M = Menu modèles)

---

## 2️⃣ **Conflit Menu Radial**

### ❌ **Avant (PROBLÈME)**
- 🖐️ **1 main ouverte** = Rotation modèle
- 🖐️ **1 main ouverte** = Menu radial → **CONFLIT !**

### ✅ **Maintenant (CORRIGÉ)**

| Geste | Action | Mains | Distinction |
|-------|--------|-------|-------------|
| 🖐️ **1 main ouverte** | Rotation | 1 | Bouger la main |
| 🖐️🖐️ **2 mains ouvertes** | Menu radial | 2 | Statiques |

**Nouveau geste menu radial :**
1. **Levez LES 2 MAINS** paumes face caméra
2. Doigts vers le **HAUT**
3. **Gardez-les fixes** 0.5s
4. Menu apparaît ! ✨

---

## 🎮 TOUS LES RACCOURCIS (Mis à Jour)

### **Clavier Principal**

| Touche | Action | Nouveau ? |
|--------|--------|-----------|
| **R** | Reset caméra | - |
| **E** | Toggle explosion | - |
| **A** | Mode analyse | ✅ Phase 2 |
| **P** | Performance Monitor | ✅ LIBÉRÉ |
| **M** | Menu modèles | - |
| **G** | Galerie modèles | - |

### **Enregistrement Gestes**

| Touche | Action | Changé ? |
|--------|--------|----------|
| **N** | Démarrer record | - |
| **L** | Lire (playback) | ✅ **P→L** |
| **K** | Stop | ✅ **M→K** |
| **Space** | Pause playback | - |

---

## 🎯 TOUS LES GESTES (Mis à Jour)

### **Gestes 1 Main**

| Geste | Action | Notes |
|-------|--------|-------|
| 👊 **Poing** | Rotation | Bouger la main |
| 🖐️ **Main ouverte** | Rotation alternative | Idem |
| ✌️ **V-sign** | Reset caméra | Cooldown 2s |
| 👍 **Thumbs up** | Toggle explosion | Cooldown 2s |
| 🤘 **Rock sign** | Mode mesure | Index+auriculaire |

### **Gestes 2 Mains**

| Geste | Action | Notes |
|-------|--------|-------|
| 🤏🤏 **2 pincements** | Zoom/Dézoom | Gain x9 |
| 👊🖐️ **Poing + Ouverte** | Explosion variable | Distance = facteur |
| 🖐️🖐️ **2 paumes face caméra** | Menu radial | ✅ **NOUVEAU !** |
| 🤘🤘 **2 rock signs** | Mode mesure 2 points | - |

---

## 📋 Comment Tester

### **Test 1 : Touche P libre**
```
1. Appuyez sur P
2. Performance Monitor apparaît (PAS de playback !)
3. ✅ Succès !
```

### **Test 2 : Nouveau menu radial**
```
1. Levez LES 2 MAINS paumes face caméra
2. Doigts pointés VERS LE HAUT
3. Gardez fixes 0.5s
4. Menu circulaire apparaît ✨
5. ✅ Succès !
```

### **Test 3 : Rotation 1 main fonctionne toujours**
```
1. Fermez le poing (1 main)
2. Bougez la main
3. Modèle tourne
4. ✅ Pas de menu qui apparaît !
```

### **Test 4 : Playback avec L**
```
1. N pour démarrer record
2. Faites des gestes
3. N pour arrêter
4. L pour rejouer
5. ✅ Replay fluide !
```

---

## 🆕 Changements Phase 2.1

### **Serveur Python (`server_v3.py`)**
✅ Nouvelle fonction `is_two_palms_menu()` - Détecte 2 mains ouvertes  
✅ Menu radial nécessite maintenant **2 mains**

### **GestureRecorder (`GestureRecorder.js`)**
✅ Play changé de **P → L**  
✅ Stop changé de **M → K**

---

## 🎯 Résumé Rapide

**Ce qui a changé :**
1. ⌨️ **P** maintenant disponible pour Performance Monitor
2. ⌨️ **L** pour Lecture/Playback des gestes
3. ⌨️ **K** pour Killer/Stop
4. 🖐️🖐️ **2 mains** requises pour menu radial

**Pourquoi :**
- Éviter conflit touche P
- Éviter conflit rotation 1 main vs menu

**Bénéfices :**
- ✅ Plus de confusions
- ✅ Gestes plus distincts
- ✅ Ergonomie améliorée

---

## 📝 Mémo Rapide

```
PERFORMANCE MONITOR : P ✅
MENU RADIAL         : 2 mains ouvertes 🖐️🖐️ ✅
PLAYBACK GESTES     : L (Lecture)
RECORD GESTES       : N (Nouveau)
STOP                : K (Kill)
```

---

**Redémarrez le serveur Python pour appliquer les changements !**

```bash
python server_v3.py
```

**Puis rechargez le navigateur : Ctrl + Shift + R**

🎉 **Conflits résolus !**
