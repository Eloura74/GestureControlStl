# 🔧 FIX OBJ TROP PETIT - Distance Minimale

## 🔴 Problème Identifié

**Logs montrent :**
```javascript
📐 Auto-Fit: Size=0.14, Distance=0.20  // OBJ = MINUSCULE ❌
📐 Auto-Fit: Size=1.40, Distance=1.99  // STL = Normal ✅
```

**Le modèle OBJ est 10x plus petit !**

**Résultat :**
- Difficile de cliquer dessus
- Beaucoup de "⚠️ Aucune intersection détectée"
- La flèche a fonctionné UNE fois (quand tu as réussi à cliquer)

---

## ✅ Solution Appliquée

### **Distance Minimale Forcée**

**Fichier :** `src/three/utils.js`

**Ajouté :**
```javascript
// Distance minimale pour éviter modèles trop petits (OBJ)
const minDistance = 1.5;
if (optimalDistance < minDistance) {
  optimalDistance = minDistance;
  console.log(`📐 Auto-Fit: Size=X.XX (PETIT) → Distance forcée à ${minDistance}`);
}
```

**Effet :**
- Si distance calculée < 1.5 → Force à 1.5
- Modèle OBJ sera plus GROS et VISIBLE
- Plus facile de cliquer dessus

---

## 🧪 TESTE MAINTENANT

### **1. Recharge**
```
Ctrl + Shift + R
```

### **2. Charge OBJ Bearing**
```
Menu (M) → Bearing (11 pièces)
```

### **3. Vérifie Console**

**Tu DOIS voir :**
```javascript
📐 Auto-Fit: Size=0.14 (PETIT) → Distance forcée à 1.5
```

**Au lieu de :**
```javascript
📐 Auto-Fit: Size=0.14, Distance=0.20
```

---

### **4. Test Annotations**

Le modèle devrait maintenant être **beaucoup plus gros** !

```
1. 🛠️ → 📝 Note
2. Clique sur OBJ
3. Console : "🎯 Intersection: ..."
4. ✅ Plus facile de cliquer !
5. Note apparaît bien placée
```

---

## 📊 Comparaison Avant/Après

### **AVANT**
```
Distance = 0.20 → Modèle MINUSCULE
⚠️ Aucune intersection détectée (difficile de cliquer)
```

### **APRÈS**
```
Distance = 1.50 → Modèle VISIBLE
🎯 Intersection détectée (facile de cliquer)
```

---

## 🎯 Logs Attendus

**Chargement OBJ :**
```javascript
✅ OBJ Model loaded: Bearing (11 parts)
📐 Auto-Fit: Size=0.14 (PETIT) → Distance forcée à 1.5  // ✅ NOUVEAU
```

**Annotations :**
```javascript
🎯 Intersection: mesh="roller_bearing", point=(...)
📝 Note ajoutée: "test"
```

---

## 🛡️ Impact STL

**STL pas affectés :**
- Distance STL = 1.99 > 1.5 minimum
- Aucun changement pour STL
- Seulement les OBJ trop petits bénéficient du fix

---

## ✅ Checklist

- [ ] Recharge (Ctrl+Shift+R)
- [ ] Charge Bearing (OBJ)
- [ ] Console : "Distance forcée à 1.5"
- [ ] Modèle PLUS GROS visible
- [ ] Clic sur modèle → "🎯 Intersection"
- [ ] Annotations bien placées

---

## 💡 Explication Technique

**Pourquoi OBJ si petit ?**

1. Modèle OBJ original très petit
2. MultiSTLManager applique scale=2.0455
3. Mais même après scale, taille = 0.14 unités
4. Auto-fit calcule distance = 0.20
5. Modèle trop proche = minuscule à l'écran

**Fix :**
- Distance minimale = 1.5
- Force caméra plus loin
- Modèle apparaît plus gros

---

**Recharge et teste ! Le modèle OBJ devrait être BEAUCOUP plus gros !** 🚀

**Tu devrais maintenant pouvoir cliquer facilement dessus !** ✨
