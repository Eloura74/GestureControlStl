# 🎨 Guide d'Ajustement - Rendu Points Holographiques

## 🎯 Paramètres Personnalisables

Tous les réglages sont dans **`src/AppV2.jsx`**.

---

## 1️⃣ Taille des Points

### Localisation
Fonction `createHolographicPointsMaterial()` → ligne ~348

### Code Actuel
```javascript
return new THREE.PointsMaterial({
  size: 0.015,  // ← ICI
  // ...
});
```

### Ajustements

| Valeur | Taille | Rendu |
|--------|--------|-------|
| `0.01` | Très petits | Points discrets, haute densité |
| `0.015` | **Actuel** | Équilibré |
| `0.02` | Moyens | Plus visibles |
| `0.03` | Gros | Points très marqués |
| `0.05` | Énormes | Style artistique |

**Recommandation** : 0.012 - 0.025

---

## 2️⃣ Luminosité des Points

### Localisation
Fonction `createPointsFromGeometry()` → ligne ~333

### Code Actuel
```javascript
const brightness = 0.7 + Math.random() * 0.3; // 0.7 à 1.0
```

### Ajustements

**Plus lumineux** :
```javascript
const brightness = 0.85 + Math.random() * 0.15; // 0.85 à 1.0
```

**Moins lumineux** :
```javascript
const brightness = 0.5 + Math.random() * 0.3; // 0.5 à 0.8
```

**Contraste fort** (certains très sombres, d'autres très clairs) :
```javascript
const brightness = Math.random(); // 0.0 à 1.0
```

**Blanc pur uniforme** :
```javascript
const brightness = 1.0; // Tous les points blancs purs
```

---

## 3️⃣ Opacité Globale

### Localisation
Fonction `createHolographicPointsMaterial()` → ligne ~351

### Code Actuel
```javascript
opacity: 0.85,  // ← ICI
```

### Ajustements

| Valeur | Effet |
|--------|-------|
| `0.5` | Très transparent, éthéré |
| `0.7` | Transparent léger |
| `0.85` | **Actuel** - Bien visible |
| `0.95` | Presque opaque |
| `1.0` | Totalement opaque |

---

## 4️⃣ Densité des Points

### Option A : Réduire (Performance)

Si **trop de points** (lag) :

```javascript
// Dans createPointsFromGeometry(), ligne ~319
for (let i = 0; i < positions.length; i += 9) { // ← Était i += 3
  sampledPoints.push(positions[i], positions[i + 1], positions[i + 2]);
}
```

**Effet** : 1 point sur 3 (÷3 points totaux)

### Option B : Augmenter (Densité)

Si **pas assez de points** :

**Méthode 1** : Subdiviser la géométrie avant conversion
```javascript
// Après loader.load(), avant createPointsFromGeometry()
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
geo = mergeVertices(geo);
// Puis créer points
```

**Méthode 2** : Interpoler des points supplémentaires (avancé)

---

## 5️⃣ Effet de Glow (Intensité)

### Localisation
Fonction `createCircleTexture()` → ligne ~369

### Code Actuel
```javascript
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
```

### Plus de Glow
```javascript
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); // ← Glow plus large
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
```

### Moins de Glow (Points nets)
```javascript
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)'); // ← Bord net
gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
```

---

## 6️⃣ Couleurs Alternatives

### Bleu Holographique
```javascript
// Dans createPointsFromGeometry(), ligne ~333
const blueness = 0.7 + Math.random() * 0.3;
colors[i] = blueness * 0.5;     // R
colors[i + 1] = blueness * 0.8; // G
colors[i + 2] = blueness;       // B (dominant)
```

### Cyan/Turquoise
```javascript
const brightness = 0.7 + Math.random() * 0.3;
colors[i] = brightness * 0.3;   // R
colors[i + 1] = brightness;     // G
colors[i + 2] = brightness;     // B
```

### Arc-en-ciel (Effet Disco)
```javascript
const hue = Math.random();
const rgb = hslToRgb(hue, 1.0, 0.7);
colors[i] = rgb[0];
colors[i + 1] = rgb[1];
colors[i + 2] = rgb[2];
```

---

## 7️⃣ Blending Mode

### Localisation
Fonction `createHolographicPointsMaterial()` → ligne ~353

### Code Actuel
```javascript
blending: THREE.AdditiveBlending,  // ← ICI
```

### Alternatives

**Normal** (pas d'effet additif) :
```javascript
blending: THREE.NormalBlending,
```

**Multiplicatif** (plus sombre) :
```javascript
blending: THREE.MultiplyBlending,
```

**Soustraction** (effet négatif) :
```javascript
blending: THREE.SubtractiveBlending,
```

**Recommandation** : Garder `AdditiveBlending` pour effet holographique

---

## 8️⃣ Fond Alternatif

### Localisation
AppV2.jsx → ligne ~40

### Code Actuel
```javascript
scene.background = new THREE.Color(0x000000); // Noir pur
```

### Alternatives

**Bleu nuit** :
```javascript
scene.background = new THREE.Color(0x0a0a1f);
```

**Gris foncé** :
```javascript
scene.background = new THREE.Color(0x1a1a1a);
```

**Dégradé** (nécessite shader) : Avancé

---

## 🎨 Presets Recommandés

### Preset 1 : Hologramme Subtil
```javascript
// Taille
size: 0.012

// Luminosité
const brightness = 0.6 + Math.random() * 0.2; // 0.6-0.8

// Opacité
opacity: 0.7
```

### Preset 2 : Points Marqués
```javascript
// Taille
size: 0.025

// Luminosité
const brightness = 0.85 + Math.random() * 0.15; // 0.85-1.0

// Opacité
opacity: 0.95
```

### Preset 3 : Nuage Éthéré
```javascript
// Taille
size: 0.02

// Luminosité
const brightness = 0.5 + Math.random() * 0.4; // 0.5-0.9

// Opacité
opacity: 0.6
```

---

## 🔄 Application des Changements

1. **Modifier** `src/AppV2.jsx`
2. **Sauvegarder** (Ctrl+S)
3. Vite **recharge automatiquement** (HMR)
4. Si pas de reload → **Rafraîchir** navigateur (F5)

---

## 🐛 Dépannage

### Points trop petits / invisibles

**Cause** : `size` trop faible  
**Solution** : Augmenter à 0.02 ou plus

### Lag / FPS bas

**Cause** : Trop de points  
**Solution** : Échantillonner (1 sur 3 ou 1 sur 5)

### Rendu carré (pas rond)

**Cause** : Texture non chargée  
**Solution** : Vérifier console pour erreurs

### Couleurs incorrectes

**Cause** : `vertexColors: false`  
**Solution** : Vérifier qu'il est `true`

---

## 📊 Performances

| Points | FPS (typique) |
|--------|---------------|
| 5,000 | 60 FPS |
| 10,000 | 60 FPS |
| 20,000 | 45-60 FPS |
| 50,000 | 30-45 FPS |
| 100,000+ | < 30 FPS |

**Recommandation** : 5,000 - 20,000 points

---

## 🎯 Configuration Optimale (Recommandée)

```javascript
// Matériau
size: 0.015
opacity: 0.85
blending: THREE.AdditiveBlending

// Couleurs
brightness: 0.7 + Math.random() * 0.3

// Densité
Tous les vertices (pas d'échantillonnage)

// Fond
#000000 (noir pur)
```

Cette configuration offre le meilleur équilibre entre esthétique et performance ! 🌟

---

**Guide d'ajustement V2.0 - Novembre 2025**
