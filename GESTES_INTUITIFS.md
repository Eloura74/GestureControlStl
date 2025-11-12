# 🎮 Gestes Intuitifs - Holo-Control V2.0

Guide des gestes **naturels et faciles** pour contrôler votre modèle 3D.

---

## 🔄 ROTATION (1 Main)

### ✋ Geste Naturel : Pointer et Déplacer

**Comment faire** :
1. Levez **UNE main** devant vous (main droite ou gauche)
2. **Pointez du doigt** (index) vers le modèle
3. **Déplacez votre main** comme si vous poussez l'objet :
   - **Gauche ← → Droite** : L'objet tourne horizontalement
   - **Haut ↑ ↓ Bas** : L'objet tourne verticalement

### 💡 Astuce
- Gardez le **bras tendu** et bougez toute la main
- Pensez à **"pousser" l'objet** avec votre index
- Plus vous bougez, plus ça tourne vite
- Mouvements de **10-15cm** suffisent

### ❌ À Éviter
- Ne bougez PAS juste le poignet (pas naturel)
- Ne bougez PAS les doigts (inefficace)
- Bougez toute la **main dans l'espace**

---

## 🔍 ZOOM (2 Mains)

### 🤏 Geste Naturel : Pincer et Écarter

**Comment faire** :
1. Levez **LES DEUX mains** devant vous
2. **Pincez** pouce+index de chaque main (comme tenir un grain de riz)
3. **Écartez vos mains** → Zoom AVANT (modèle s'approche)
4. **Rapprochez vos mains** → Zoom ARRIÈRE (modèle s'éloigne)

### 💡 Astuce
- Pensez à **"étirer" l'objet** entre vos mains
- Mouvements de **20-30cm** pour effet visible
- Gardez le pincement tout le temps

### ❌ À Éviter
- Ne relâchez PAS le pincement pendant le mouvement
- Ne bougez PAS qu'une seule main

---

## 💥 EXPLOSION (Index Levé)

### ☝️ Geste : Lever l'Index

**Comment faire** :
1. Avec **n'importe quelle main**
2. **Levez l'index** (comme pointer vers le haut)
3. Le modèle **s'éclate** progressivement
4. **Baissez l'index** → Retour normal

### 💡 Astuce
- Fonctionne **en parallèle** de rotation ou zoom
- Explosion **progressive** (pas instantanée)

---

## ❄️ FREEZE (Poing Fermé)

### ✊ Geste : Fermer le Poing

**Comment faire** :
1. **Fermez le poing** → Tous les gestes sont gelés 0.3s
2. Utile pour **repositionner** vos mains sans bouger l'objet

---

## 🎯 Comparaison Intuitivité

| Geste | Avant (Poignet) | Maintenant (Index) |
|-------|-----------------|-------------------|
| **Rotation** | 😕 Pas naturel | ✅ Très intuitif |
| **Mouvement** | Plier poignet | Pointer et déplacer |
| **Facilité** | 3/10 | 9/10 |
| **Précision** | 5/10 | 8/10 |

---

## ⚙️ Configuration (config.toml)

### Profils Disponibles

**BALANCED** (Recommandé) :
```toml
rot_gain = 8.0      # Réactif mais contrôlable
zoom_gain = 3.0     # Fluide
smooth = 0.5        # Lissage équilibré
```

**PRECISE** (Modélisation fine) :
```toml
rot_gain = 1.5      # Mouvements fins
zoom_gain = 0.4     # Zoom lent
smooth = 0.7        # Très lisse
```

**REACTIVE** (Démos rapides) :
```toml
rot_gain = 3.0      # Réponse immédiate
zoom_gain = 0.7     # Zoom rapide
smooth = 0.3        # Peu de lissage
```

### Changer de Profil

**Interface** : Clic sur badge (bas-droite)  
**Clavier** : Touche **G** pour cycler  
**API** : `curl -X POST http://localhost:8765/api/config/profile/precise`

---

## 💡 Conseils d'Utilisation

### Pour Rotation Fluide

1. **Bras tendus** : Gardez le bras semi-tendu
2. **Mouvements amples** : 10-15cm minimum
3. **Régulier** : Vitesse constante pour fluidité
4. **Index pointé** : Comme si vous touchez un écran tactile dans l'espace

### Pour Zoom Précis

1. **Pincez fermement** : Pouce et index proches (< 5cm)
2. **Mouvements lents** : Pour contrôle fin
3. **Symétrique** : Bougez les deux mains ensemble
4. **Amplitude** : 20-30cm pour changement visible

### Distance Caméra

**Optimale** : 50-80cm de la webcam  
**Trop près** (< 40cm) : Mains coupées  
**Trop loin** (> 100cm) : Détection instable

### Éclairage

**Bon** : Lumière devant vous (face)  
**Mauvais** : Contre-jour (fenêtre derrière)

---

## 🎮 Exercices Pratiques

### Exercice 1 : Rotation Simple

1. Levez **main droite**, index pointé
2. **Déplacez vers la droite** → Modèle tourne
3. **Déplacez vers la gauche** → Modèle tourne inverse
4. **Relâchez** → Modèle s'arrête

**Temps** : 30 secondes  
**Objectif** : Maîtriser rotation horizontale

### Exercice 2 : Rotation Complète

1. Main droite, index pointé
2. **Tracez un cercle** dans l'air
3. Le modèle devrait **tourner en suivant**

**Temps** : 1 minute  
**Objectif** : Rotation fluide

### Exercice 3 : Zoom Précis

1. Deux mains en pincement
2. **Écartez lentement** (5cm) → Zoom léger
3. **Rapprochez** (5cm) → Retour
4. **Répétez** 5 fois

**Temps** : 1 minute  
**Objectif** : Contrôle fin du zoom

---

## 🔧 Réglages Avancés

### Rotation Trop Rapide ?

```toml
# Réduire sensibilité
rot_gain = 5.0  # Au lieu de 8.0
```

### Rotation Trop Lente ?

```toml
# Augmenter sensibilité
rot_gain = 12.0  # Au lieu de 8.0
```

### Rotation Saccadée ?

```toml
# Augmenter lissage
smooth = 0.7  # Au lieu de 0.5
```

### Rotation Trop Lissée ?

```toml
# Réduire lissage
smooth = 0.3  # Au lieu de 0.5
```

---

## ❓ FAQ

### Q: La rotation part dans tous les sens ?

**R:** Gardez le bras plus stable, ne bougez que la main (pas tout le bras).

### Q: Le zoom ne fonctionne pas ?

**R:** Vérifiez que :
- Les DEUX mains sont en pincement (pouce+index proches)
- Distance entre pincements > 8cm
- Badge affiche "🔍 Zoom"

### Q: Comment avoir une rotation ultra-précise ?

**R:** Passez au profil "PRECISE" (touche G) → Mouvements fins, très stable.

### Q: Comment avoir une rotation très réactive ?

**R:** Passez au profil "REACTIVE" (touche G) → Réponse immédiate.

---

## 🎉 Résultat Attendu

Avec ces gestes **intuitifs** :

✅ **Rotation** : Naturelle comme déplacer un objet réel  
✅ **Zoom** : Facile comme pincer-zoomer sur smartphone  
✅ **Précision** : Contrôle fin avec Kalman + FSM  
✅ **Fluidité** : Lissage adaptatif pour mouvements naturels  

---

**Bon contrôle avec des gestes naturels ! 🎮✨**
