# 📦 Guide Export OBJ pour Vue Éclatée

## 🎯 Objectif

Exporter vos assemblages CAD en **fichier .obj** avec plusieurs objets/groupes pour permettre une **vue éclatée** dans Holo-Control.

---

## 🔧 Export depuis logiciel CAD

### Option 1 : Fusion 360 / Inventor

1. **Ouvrir votre assemblage**
2. **File → Export** → Format **OBJ**
3. **Cocher** : "Export as one file per component" OU "Separate objects"
4. Si pas d'option : Exporter chaque pièce individuellement puis les combiner

**Alternative** : Exporter en STL séparés puis utiliser Blender pour combiner

---

### Option 2 : SolidWorks

1. **File → Save As** → Format **OBJ**
2. Options → **"Export as multiple bodies"**
3. Ou : Exporter chaque composant séparément puis combiner dans Blender

---

### Option 3 : Blender (Recommandé pour combiner des STL)

#### Étape 1 : Importer vos STL séparés

```
File → Import → STL
```

Importer chaque pièce de votre assemblage :
- `piece_1.stl`
- `piece_2.stl`
- `vis_1.stl`
- `vis_2.stl`
- etc.

#### Étape 2 : Organiser

1. Dans l'**Outliner** (panneau droit), chaque STL est un objet séparé
2. Renommer les objets pour clarté :
   - Clic droit → Rename
   - `piece_1` → `Inner Ring`
   - `piece_2` → `Outer Ring`

#### Étape 3 : Centrer l'assemblage

1. Sélectionner tous les objets (A)
2. `Object → Set Origin → Origin to Geometry`
3. `Object → Transform → Origin to Center of Mass`

#### Étape 4 : Export en OBJ

```
File → Export → Wavefront (.obj)
```

**Options importantes** :
- ✅ **Export → Selection Only** (si vous voulez seulement certaines pièces)
- ✅ **Include → Objects as OBJ Objects** (IMPORTANT !)
- ✅ **Include → Objects as OBJ Groups** (IMPORTANT !)
- ✅ **Transform → Y Up** (pour Three.js)
- ✅ **Geometry → Apply Modifiers**
- ✅ **Geometry → Write Normals**

Exporter : `assemblage_bearing.obj`

---

## 📁 Structure fichier OBJ

Votre fichier OBJ doit ressembler à ça :

```obj
# Blender v3.x OBJ File
o Inner_Ring
v 0.5 0.0 0.0
v 0.5 0.1 0.0
...
f 1 2 3

o Outer_Ring
v 1.0 0.0 0.0
v 1.0 0.1 0.0
...
f 100 101 102

o Ball_1
v 0.7 0.5 0.0
...
```

Chaque ligne `o NomObjet` crée un nouvel objet séparable.

---

## 🚀 Utilisation dans Holo-Control

### 1. Copier le fichier OBJ

```bash
Copier votre_assemblage.obj dans :
a:\Dev\ViewCamMouvement\holo-control\public\models\
```

### 2. Ajouter à la galerie

Éditer `AppV3_Premium.jsx` ligne 205 :

```javascript
// Ajouter des modèles STL à la galerie
multiSTL.addModel("/models/Frame_Bolt.stl", "Frame Bolt");
multiSTL.addModel("/models/roller_bearing.stl", "Roller Bearing");
multiSTL.addModel("/models/votre_assemblage.obj", "Votre Assemblage"); // ← AJOUTER ICI
```

### 3. Charger au démarrage

Éditer ligne 214 :

```javascript
// Charger tous les modèles en parallèle
await Promise.all([
  multiSTL.loadModel(0),
  multiSTL.loadModel(1),
  multiSTL.loadModel(2)  // ← AJOUTER
]);
```

### 4. Tester

1. Relancer l'application
2. Ouvrir la galerie (bouton 📦)
3. Sélectionner votre assemblage OBJ
4. Faire le geste explosion : 🤜 Poing + ✋ Main ouverte
5. Écarter/rapprocher les mains pour contrôler l'éclatement

---

## ✅ Avantages OBJ vs STL

| Format | Avantages | Vue éclatée |
|--------|-----------|-------------|
| **STL** | Simple, universel, petit | ❌ Non (maillage unique) |
| **OBJ** | Plusieurs objets, couleurs, normales | ✅ Oui (si plusieurs objets) |
| **GLTF** | Moderne, optimisé web, matériaux | ✅ Oui (meilleur) |

---

## 🎯 Exemple Roller Bearing

Si vous voulez une vue éclatée du roller bearing, exportez chaque pièce :

### Structure idéale :

```
roller_bearing_assemblage.obj
├── o Inner_Ring          (anneau intérieur)
├── o Outer_Ring          (anneau extérieur)
├── o Ball_01             (bille 1)
├── o Ball_02             (bille 2)
├── o Ball_03             (bille 3)
├── o Ball_04             (bille 4)
├── o Ball_05             (bille 5)
├── o Ball_06             (bille 6)
└── o Cage                (cage de billes)
```

Chaque `o NomObjet` sera éclaté individuellement !

---

## 🐛 Troubleshooting

### Problème : OBJ ne s'éclate pas

**Cause** : Fichier OBJ avec un seul objet

**Solution** :
1. Ouvrir le `.obj` dans un éditeur texte
2. Vérifier qu'il y a plusieurs lignes `o NomObjet`
3. Si un seul objet : Réimporter dans Blender et séparer :
   - Mode Edit (Tab)
   - Sélectionner des faces (Alt+Click)
   - P → Separate by loose parts

### Problème : Explosion dans mauvaise direction

**Cause** : Les pièces ne sont pas centrées

**Solution** :
- Dans Blender : `Object → Set Origin → Origin to Center of Mass`
- Puis re-exporter

### Problème : Modèle trop grand/petit

**Cause** : Échelle différente

**Solution** :
- Le code applique automatiquement scale 0.05
- Si trop petit : Modifier ligne 92 et 151 dans `MultiSTLManager.js` :
  ```javascript
  mesh.scale.set(0.08, 0.08, 0.08); // Au lieu de 0.05
  ```

---

## 📚 Ressources

- **Blender Download** : https://www.blender.org/download/
- **OBJ Format Spec** : https://en.wikipedia.org/wiki/Wavefront_.obj_file
- **Three.js OBJLoader** : https://threejs.org/docs/#examples/en/loaders/OBJLoader

---

## ✨ Résultat Final

Une fois configuré, vous aurez :

1. **STL** : Vue normale avec explosion "éclatement" des vertices
2. **OBJ multi-objets** : Vue éclatée propre avec chaque pièce qui s'écarte

**Contrôle** : 🤜 Poing fermé + ✋ Main ouverte  
**Distance mains** = Facteur d'éclatement

---

**Bon export ! 🚀**
