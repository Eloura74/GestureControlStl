# 🎮 Guide des Gestes - Holo-Control v2

## 🔄 Rotation du Modèle

### Activation
- **UNE SEULE main** visible devant la caméra
- N'importe quelle position de main (ouverte, fermée, etc.)

### Contrôle
```
     👆 HAUT = Rotation vers le haut
      |
  ←---🖐️---→  GAUCHE/DROITE = Rotation horizontale
      |
     👇 BAS = Rotation vers le bas
```

### Instructions
1. Levez votre main droite (ou gauche) devant la caméra
2. Bougez le **poignet** (pas les doigts) :
   - **Gauche/Droite** → Le modèle tourne horizontalement
   - **Haut/Bas** → Le modèle tourne verticalement

### Astuces
- Mouvements lents pour plus de précision
- Maintenez votre avant-bras stable, ne bougez que le poignet
- Si ça ne fonctionne pas : vérifiez qu'il n'y a qu'UNE seule main visible

---

## 🔍 Zoom

### Activation
- **DEUX mains** visibles devant la caméra
- Les deux mains en **PINCEMENT** (pouce et index rapprochés)

### Contrôle
```
🤏 ←----------→ 🤏   ÉCARTER = Zoom AVANT (modèle s'approche)

🤏 ------------ 🤏   RAPPROCHER = Zoom ARRIÈRE (modèle s'éloigne)
```

### Instructions
1. Faites un **pincement** (pouce + index rapprochés) avec la **main gauche** 🤏
2. Faites un **pincement** (pouce + index rapprochés) avec la **main droite** 🤏
3. Écartez ou rapprochez les deux mains :
   - **ÉCARTER les mains** → Zoom AVANT (le modèle s'approche, devient plus gros)
   - **RAPPROCHER les mains** → Zoom ARRIÈRE (le modèle s'éloigne, devient plus petit)

### Astuces
- Pincez bien (pouce et index doivent être PROCHES, distance < 8cm)
- Mouvements fluides et continus
- Si ça ne zoom pas : vérifiez que les deux mains font bien le pincement
- Pensez à l'inverse d'une loupe : mains écartées = voir plus gros

---

## 💥 Explosion du Modèle

### Activation
- Au moins **UNE main** visible
- **Index levé** ☝️

### Contrôle
```
Index LEVÉ   ☝️  = Explosion progressive (0% → 100%)
Index BAISSÉ 👇  = Implosion (retour à 0%)
```

### Instructions
1. Levez l'index de n'importe quelle main
2. Le modèle s'éclate progressivement
3. Baissez l'index pour le reformer

### Notes
- Fonctionne en parallèle de la rotation ou du zoom
- L'explosion monte graduellement (pas instantané)

---

## ❄️ Freeze (Gel)

### Activation
- Au moins **UNE main** visible
- **Poing fermé** ✊

### Contrôle
```
Poing fermé ✊ = Gel de TOUS les gestes pendant 0.3s
```

### Instructions
1. Fermez le poing
2. Tous les gestes sont gelés temporairement
3. Utilisez pour "réinitialiser" votre position sans bouger le modèle

### Notes
- Durée : 0.3 secondes après avoir fermé le poing
- L'indicateur **FREEZE** apparaît dans le HUD
- Utile pour repositionner vos mains

---

## 🎯 Combinaisons de Gestes

### ✅ Possibles
- **Rotation + Explosion** : UNE main ouverte + index levé
- **Zoom + Explosion** : DEUX mains en pincement (un index peut être levé)

### ❌ Impossibles
- **Rotation + Zoom** : Impossible (1 main vs 2 mains)

---

## 🐛 Diagnostic des Problèmes

### La rotation ne fonctionne pas
- ✅ Une seule main visible (pas deux)
- ✅ Pas de deuxième main dans le champ de la caméra
- ✅ Bon éclairage
- ✅ Bougez le poignet, pas les doigts

### Le zoom ne fonctionne pas
- ✅ Deux mains visibles
- ✅ Pouce et index de chaque main sont rapprochés (< 8cm)
- ✅ Distance claire entre les deux mains
- ✅ Pas de confusion avec d'autres gestes

### Les gestes sont instables
- Augmentez `ROT_DEADZONE` dans `gestures_server.py`
- Augmentez `SMOOTH` (max 0.9)
- Améliorez l'éclairage
- Réduisez les mouvements brusques

---

## ⚙️ Paramètres de Sensibilité

### Dans `gestures_server.py`

```python
# Plus de sensibilité rotation
ROT_GAIN = 0.015  # Défaut: 0.012

# Moins de sensibilité rotation
ROT_GAIN = 0.008

# Plus de sensibilité zoom
ZOOM_GAIN = 0.008  # Défaut: 0.005

# Moins de sensibilité zoom
ZOOM_GAIN = 0.003

# Plus lisse (moins réactif)
SMOOTH = 0.8  # Défaut: 0.65

# Plus réactif (moins lisse)
SMOOTH = 0.5
```

---

**Bonne manipulation !** 🎮✨
