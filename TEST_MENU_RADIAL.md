# 🧪 TEST MENU RADIAL - Guide de Debug

## 🔴 Problème Identifié

**Symptôme :**
- 2 mains levées paumes face caméra
- Mode "EXPLODE" affiché au lieu de menu
- Menu radial n'apparaît pas

**Cause :**
- FSM détecte EXPLODE avant menu radial
- Pas de priorité pour le menu

---

## ✅ Solution Appliquée

### **Changements Serveur (`server_v3.py`)**

1. **Détection menu AVANT FSM** (ligne ~315)
   ```python
   is_menu_radial_active = self.is_two_palms_menu(hands_landmarks)
   ```

2. **Force IDLE si menu actif** (ligne ~328)
   ```python
   current_mode = self.fsm.update(
       ...
       force_idle=is_menu_radial_active  # Empêche EXPLODE
   )
   ```

3. **Log de debug** (ligne ~319)
   ```python
   if is_menu_radial_active and self.frame_count % 15 == 0:
       logger.info("🎯 Menu radial actif - Mode forcé à IDLE")
   ```

### **Changements Frontend (`AppV3_Premium.jsx`)**

1. **Log console** (ligne ~414)
   ```javascript
   if (gestures.palm_menu) {
       console.log('🎯 Menu radial: 2 mains détectées !');
   ```

---

## 🧪 Procédure de Test

### **1. Redémarrer le serveur Python**
```bash
cd a:\Dev\ViewCamMouvement\holo-control
python server_v3.py
```

### **2. Vérifier logs serveur au démarrage**
```
✅ Camera opened: 1280x720 @ 60 FPS
📡 WebSocket: ws://127.0.0.1:8765/ws
```

### **3. Recharger navigateur**
```
http://localhost:5173
Ctrl + Shift + R
```

### **4. Test Menu Radial**

**Étape par étape :**

1. **Lever LES 2 MAINS** paumes face caméra
   - Doigts pointés **VERS LE HAUT**
   - Les 2 mains bien **ouvertes**
   - Garder **fixes** 0.5s

2. **Observer HUD en haut à gauche**
   - ✅ **Devrait afficher : "IDLE"** (PAS "EXPLODE")
   - ❌ Si "EXPLODE" → Problème pas résolu

3. **Observer console navigateur (F12)**
   ```
   ✅ Devrait afficher : 🎯 Menu radial: 2 mains détectées !
   ❌ Si rien → Serveur n'envoie pas le flag
   ```

4. **Observer terminal Python**
   ```
   ✅ Devrait afficher : 🎯 Menu radial actif - Mode forcé à IDLE
   ❌ Si rien → Détection ne fonctionne pas
   ```

5. **Observer scène 3D**
   ```
   ✅ Menu circulaire apparaît avec 8 options
   ❌ Si absent → Problème côté RadialMenu.js
   ```

---

## 🔍 Debug Checklist

### **Si HUD affiche toujours "EXPLODE"**

- [ ] Serveur redémarré ?
- [ ] Navigateur rechargé (Ctrl+Shift+R) ?
- [ ] Les 2 mains sont-elles vraiment ouvertes ?
- [ ] Doigts pointés vers le haut (pas côté) ?
- [ ] Console Python montre le log menu radial ?

### **Si console navigateur ne montre rien**

- [ ] WebSocket connecté ? ("✅ [WS V3 PREMIUM] Connecté")
- [ ] Ouvrir onglet Network → WS → Messages
- [ ] Vérifier si `palm_menu: true` dans messages

### **Si serveur ne détecte pas**

**Tester la fonction manuellement :**

```python
# Dans server_v3.py, ajouter temporairement après ligne 200:
def is_two_palms_menu(self, hands_landmarks):
    if len(hands_landmarks) < 2:
        print(f"❌ Seulement {len(hands_landmarks)} main(s)")
        return False
    
    palm1 = self.is_palm_facing_camera(hands_landmarks[0])
    palm2 = self.is_palm_facing_camera(hands_landmarks[1])
    
    print(f"🖐️ Main 1: {'✅' if palm1 else '❌'}")
    print(f"🖐️ Main 2: {'✅' if palm2 else '❌'}")
    
    return palm1 and palm2
```

---

## 📋 Logs Attendus (Fonctionnement Normal)

### **Serveur Python**
```
INFO - [Frame 450] Mode=IDLE, Hands=2, FPS=28.5
INFO - 🎯 Menu radial actif - Mode forcé à IDLE
INFO - 🎯 Menu radial actif - Mode forcé à IDLE
```

### **Console Navigateur**
```javascript
✅ [WS V3 PREMIUM] Connecté
🎯 Menu radial: 2 mains détectées !
🎯 Menu radial activé
```

### **HUD Visual**
```
Mode: IDLE  (PAS EXPLODE)
FPS: 60
Hands: 2
```

---

## 🎯 Test Complet

### **Scénario 1 : Menu Radial**
1. Lever 2 mains paumes → Mode IDLE + Menu apparaît ✅
2. Pointer index → Option s'illumine ✅
3. Maintenir 0.5s → Action exécutée ✅
4. Baisser mains → Menu disparaît ✅

### **Scénario 2 : Explosion toujours fonctionnelle**
1. Lever poing + main ouverte → Mode EXPLODE ✅
2. Écarter/rapprocher → Explosion variable ✅
3. Pas de conflit avec menu ✅

### **Scénario 3 : Rotation 1 main**
1. Lever 1 main poing → Mode ROTATE ✅
2. Bouger main → Modèle tourne ✅
3. Pas de menu qui apparaît ✅

---

## 🚨 Si Ça Ne Marche Toujours Pas

### **Option 1 : Debug visuel**

Ajouter dans `is_palm_facing_camera()` (server_v3.py ligne ~188) :

```python
def is_palm_facing_camera(self, landmarks):
    is_open = self.is_hand_open(landmarks)
    
    wrist_y = landmarks[0].y
    middle_tip_y = landmarks[12].y
    fingers_up = middle_tip_y < wrist_y - 0.1
    
    result = is_open and fingers_up
    
    # DEBUG
    print(f"  Open: {'✅' if is_open else '❌'}, "
          f"Up: {'✅' if fingers_up else '❌'}, "
          f"Result: {'✅' if result else '❌'}")
    
    return result
```

### **Option 2 : Relâcher contrainte**

Si les mains ne sont pas détectées comme "face caméra", modifier ligne ~196 :

```python
# Avant
fingers_up = middle_tip_y < wrist_y - 0.1

# Après (plus permissif)
fingers_up = middle_tip_y < wrist_y - 0.05  # Seuil réduit
```

### **Option 3 : Geste alternatif**

Si vraiment impossible, changer pour **"2 index levés"** :

```python
def is_two_index_menu(self, hands_landmarks):
    if len(hands_landmarks) < 2:
        return False
    
    index1_up = self.finger_extended(hands_landmarks[0], 8, 6)
    index2_up = self.finger_extended(hands_landmarks[1], 8, 6)
    
    # Autres doigts fermés
    others1 = sum(self.finger_extended(hands_landmarks[0], tip, pip) 
                  for tip, pip in [(12,10), (16,14), (20,18)]) == 0
    others2 = sum(self.finger_extended(hands_landmarks[1], tip, pip) 
                  for tip, pip in [(12,10), (16,14), (20,18)]) == 0
    
    return index1_up and index2_up and others1 and others2
```

---

## 📊 Matrice de Debug

| Symptôme | Cause Probable | Solution |
|----------|----------------|----------|
| Mode EXPLODE affiché | FSM pas forcé IDLE | Vérifier `force_idle` passé |
| Pas de log Python | Fonction pas appelée | Vérifier ligne ~316 |
| Pas de log JS | WebSocket pas reçu | Vérifier `palm_menu` dans WS |
| Menu n'apparaît pas | RadialMenu.show() pas appelé | Vérifier ligne ~416 |
| Mains pas détectées | Orientation pas bonne | Ajuster seuil ligne ~196 |

---

## ✅ Validation Finale

**Le menu radial fonctionne si :**

1. ✅ Serveur log : "🎯 Menu radial actif"
2. ✅ HUD affiche : "IDLE" (pas EXPLODE)
3. ✅ Console JS : "🎯 Menu radial: 2 mains détectées !"
4. ✅ Menu circulaire visible dans scène 3D
5. ✅ Pointage index sélectionne options

---

**Après test, donne-moi les logs que tu vois pour qu'on identifie exactement où ça bloque !** 🔍
