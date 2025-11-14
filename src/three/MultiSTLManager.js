/**
 * MULTI-STL MANAGER - Système de galerie et swap de modèles
 * Permet de charger et basculer entre plusieurs modèles STL
 */

import * as THREE from 'three';
import { STLLoader, OBJLoader } from 'three-stdlib';

export class MultiSTLManager {
  constructor(scene, root, material, camera, autoFitCallback) {
    this.scene = scene;
    this.root = root;
    this.material = material;
    this.camera = camera;
    this.autoFitCallback = autoFitCallback;
    
    this.models = [];
    this.currentModelIndex = 0;
    this.currentMesh = null;
    this.currentMeshGroup = null; // Pour OBJ avec plusieurs meshes
    this.stlLoader = new STLLoader();
    this.objLoader = new OBJLoader();
    this.isLoading = false;
    this.transitionDuration = 800; // ms
    
    console.log("📚 MultiSTLManager initialized (STL + OBJ support)");
  }

  /**
   * Ajoute un modèle à la galerie
   */
  addModel(path, name = null) {
    const fileExt = path.split('.').pop().toLowerCase();
    const modelName = name || path.split('/').pop().replace(/\.(stl|obj)$/i, '');
    
    this.models.push({
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: path,
      name: modelName,
      type: fileExt, // 'stl' ou 'obj'
      mesh: null,
      meshGroup: null, // Pour OBJ avec plusieurs objets
      meshes: [], // Liste des meshes si OBJ multi-objets
      geometry: null,
      loaded: false,
      hasMultipleParts: false // True si OBJ avec plusieurs objets
    });
    
    console.log(`➕ Model added: ${modelName} (${this.models.length} total)`);
    
    return this.models.length - 1;
  }

  /**
   * Charge un modèle (STL ou OBJ)
   */
  async loadModel(index) {
    if (index < 0 || index >= this.models.length) {
      console.warn(`⚠️ Invalid model index: ${index}`);
      return false;
    }

    const model = this.models[index];
    
    if (model.loaded) {
      console.log(`✅ Model already loaded: ${model.name}`);
      return true;
    }

    this.isLoading = true;
    
    // Charger selon le type de fichier
    if (model.type === 'obj') {
      return this.loadOBJModel(model, index);
    } else {
      return this.loadSTLModel(model, index);
    }
  }

  /**
   * Charge un modèle STL
   */
  loadSTLModel(model, index) {
    return new Promise((resolve, reject) => {
      this.stlLoader.load(
        model.path,
        (geometry) => {
          geometry.computeVertexNormals();
          geometry.center();
          
          const mesh = new THREE.Mesh(geometry, this.material);
          mesh.scale.set(0.05, 0.05, 0.05);
          mesh.name = model.name;
          
          // Stocker vertices originaux pour explosion basique
          const positions = geometry.attributes.position.array;
          const origPos = new Float32Array(positions);
          mesh.userData.originalPositions = origPos;
          
          mesh.userData.applyExplosion = (factor) => {
            for (let i = 0; i < positions.length; i += 3) {
              const x = origPos[i];
              const y = origPos[i + 1];
              const z = origPos[i + 2];
              const len = Math.sqrt(x*x + y*y + z*z) || 1;
              positions[i] = x + (x / len) * factor * 0.3;
              positions[i + 1] = y + (y / len) * factor * 0.3;
              positions[i + 2] = z + (z / len) * factor * 0.3;
            }
            geometry.attributes.position.needsUpdate = true;
          };
          
          model.mesh = mesh;
          model.geometry = geometry;
          model.loaded = true;
          model.hasMultipleParts = false;
          
          this.isLoading = false;
          
          console.log(`✅ STL Model loaded: ${model.name}`);
          
          window.dispatchEvent(new CustomEvent("multiSTL:loaded", {
            detail: { index, name: model.name, type: 'stl' }
          }));
          
          resolve(true);
        },
        undefined,
        (err) => {
          console.error(`❌ Failed to load STL: ${model.name}`, err);
          this.isLoading = false;
          reject(err);
        }
      );
    });
  }

  /**
   * Charge un modèle OBJ
   */
  loadOBJModel(model, index) {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        model.path,
        (object) => {
          // Debug : Logger la structure
          console.log(`🔍 OBJ Structure:`, object);
          console.log(`🔍 Children: ${object.children.length}`);
          
          // Extraire tous les meshes et les aplatir (supprimer groupes intermédiaires)
          const meshes = [];
          const intermediateGroups = [];
          object.traverse((child) => {
            if (child.isMesh) {
              // S'assurer que les normales sont calculées (crucial pour raycasting et annotations)
              if (child.geometry && child.geometry.attributes && !child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals();
              }
              meshes.push(child);
              console.log(`  └─ Mesh found: "${child.name}" (vertices: ${child.geometry.attributes.position.count})`);
            } else if (child.isGroup && child !== object) {
              intermediateGroups.push(child);
            }
          });
          
          // Aplatir : déplacer tous les meshes directement dans object et CONSERVER leurs positions world
          meshes.forEach(mesh => {
            if (mesh.parent !== object) {
              // Sauvegarder la position/rotation/scale WORLD
              const worldPos = new THREE.Vector3();
              const worldQuat = new THREE.Quaternion();
              const worldScale = new THREE.Vector3();
              mesh.getWorldPosition(worldPos);
              mesh.getWorldQuaternion(worldQuat);
              mesh.getWorldScale(worldScale);
              
              // Retirer du parent actuel et ajouter directement à object
              mesh.parent.remove(mesh);
              object.add(mesh);
              
              // Restaurer la position/rotation/scale WORLD comme position locale
              mesh.position.copy(worldPos);
              mesh.quaternion.copy(worldQuat);
              mesh.scale.copy(worldScale);
            }
          });
          
          // Supprimer les groupes intermédiaires vides
          intermediateGroups.forEach(group => {
            if (group.children.length === 0 && group.parent) {
              group.parent.remove(group);
            }
          });
          
          console.log(`📦 Total meshes found: ${meshes.length} (flattened)`);
          
          // Calculer bounding box pour auto-scale
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Calculer scale pour avoir une taille similaire aux STL
          // Augmenter targetSize pour que les OBJ soient bien visibles et zoomables
          const targetSize = 4.5;  // 3.0 → 4.5 pour permettre un meilleur zoom
          const autoScale = targetSize / maxDim;
          object.scale.set(autoScale, autoScale, autoScale);
          
          console.log(`📐 OBJ Auto-scale: ${maxDim.toFixed(2)} → scale ${autoScale.toFixed(4)}`);
          
          // Centrer l'objet après scale - IMPORTANT pour que la rotation soit centrée
          const boxScaled = new THREE.Box3().setFromObject(object);
          const center = boxScaled.getCenter(new THREE.Vector3());
          
          // Déplacer CHAQUE MESH pour centrer l'ensemble à (0,0,0)
          // Ça préserve les positions relatives ET garde le groupe parent à (0,0,0)
          meshes.forEach(mesh => {
            mesh.position.sub(center);
          });
          
          // Groupe parent reste à l'origine
          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(autoScale, autoScale, autoScale);
          object.quaternion.set(0, 0, 0, 1);
          
          // IMPORTANT : Mettre à jour les matrices après positionnement
          object.updateMatrix();
          object.updateMatrixWorld(true);
          
          console.log(`📍 OBJ Group: pos=(${object.position.x.toFixed(2)},${object.position.y.toFixed(2)},${object.position.z.toFixed(2)}), rot=(0,0,0), scale=(${autoScale.toFixed(4)})`);

          
          // Recalculer la bounding box APRÈS le centrage
          const finalBox = new THREE.Box3().setFromObject(object);
          const globalCenter = new THREE.Vector3(0, 0, 0); // Le centre est maintenant à l'origine
          
          // Stocker les positions de chaque mesh pour l'explosion
          // EXPLOSION TECHNIQUE LINÉAIRE (style Sketchfab)
          
          // 1. Calculer l'axe principal du modèle (axe le plus long)
          const modelBox = new THREE.Box3().setFromObject(object);
          const modelSize = new THREE.Vector3();
          modelBox.getSize(modelSize);
          
          // FORCER l'axe Y (vertical) pour l'explosion
          // Cela donne une vue technique plus claire (empilement vertical)
          const mainAxis = 'y';
          
          console.log(`📐 Model size: (${modelSize.x.toFixed(2)}, ${modelSize.y.toFixed(2)}, ${modelSize.z.toFixed(2)}) → Forced axis: ${mainAxis.toUpperCase()} (vertical)`);
          
          // 2. Trier les meshes par position sur l'axe principal
          const sortedMeshes = meshes.map((mesh, idx) => {
            mesh.geometry.computeBoundingBox();
            const meshBox = mesh.geometry.boundingBox;
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);
            meshCenter.applyMatrix4(mesh.matrixWorld);
            
            return { 
              mesh, 
              idx, 
              center: meshCenter,
              axisPos: meshCenter[mainAxis]
            };
          }).sort((a, b) => a.axisPos - b.axisPos);
          
          // 3. Assigner index de tri pour explosion LINÉAIRE (pas de direction)
          sortedMeshes.forEach((item, sortedIdx) => {
            const { mesh, center } = item;
            
            // Stocker SEULEMENT les données nécessaires (pas de direction)
            mesh.userData.initialLocalPosition = mesh.position.clone();
            mesh.userData.sortedIndex = sortedIdx; // Index dans l'ordre trié
            mesh.userData.totalMeshes = meshes.length;
            mesh.userData.axisValue = center[mainAxis]; // Position sur l'axe principal
            mesh.matrixAutoUpdate = true;
            
            // Log des premières pièces seulement
            if (sortedIdx < 3) {
              console.log(`  🎯 Mesh ${sortedIdx}/"${mesh.name}": ${mainAxis}=${center[mainAxis].toFixed(2)}, sortedIdx=${sortedIdx}`);
            }
          });
          
          console.log(`✅ ${meshes.length} meshes ready for explosion`);
          
          // Le groupe parent et les meshes gardent matrixAutoUpdate = true
          object.matrixAutoUpdate = true;
          
          model.meshGroup = object;
          model.meshes = meshes;
          model.loaded = true;
          model.hasMultipleParts = meshes.length > 1;
          model.mainAxis = mainAxis; // Stocker l'axe principal pour l'explosion
          
          this.isLoading = false;
          
          console.log(`✅ OBJ Model loaded: ${model.name} (${meshes.length} parts)`);
          
          window.dispatchEvent(new CustomEvent("multiSTL:loaded", {
            detail: { 
              index, 
              name: model.name, 
              type: 'obj',
              parts: meshes.length 
            }
          }));
          
          resolve(true);
        },
        undefined,
        (err) => {
          console.error(`❌ Failed to load OBJ: ${model.name}`, err);
          this.isLoading = false;
          reject(err);
        }
      );
    });
  }

  /**
   * Charge tous les modèles de la galerie
   */
  async loadAllModels() {
    console.log(`📥 Loading ${this.models.length} models...`);
    
    for (let i = 0; i < this.models.length; i++) {
      try {
        await this.loadModel(i);
      } catch (err) {
        console.error(`❌ Failed to load model ${i}:`, err);
      }
    }
    
    console.log("✅ All models loaded");
  }

  /**
   * Bascule vers le modèle suivant
   */
  async nextModel() {
    const nextIndex = (this.currentModelIndex + 1) % this.models.length;
    return this.switchToModel(nextIndex);
  }

  /**
   * Bascule vers le modèle précédent
   */
  async previousModel() {
    const prevIndex = (this.currentModelIndex - 1 + this.models.length) % this.models.length;
    return this.switchToModel(prevIndex);
  }

  /**
   * Bascule vers un modèle spécifique avec transition
   */
  async switchToModel(index) {
    if (index < 0 || index >= this.models.length) {
      console.warn(`⚠️ Invalid model index: ${index}`);
      return false;
    }

    if (index === this.currentModelIndex && this.currentMesh) {
      console.log("ℹ️ Already on this model");
      return true;
    }

    // Charger si pas encore fait
    if (!this.models[index].loaded) {
      await this.loadModel(index);
    }

    const newModel = this.models[index];
    
    console.log(`🔄 Switching to model: ${newModel.name} (${newModel.type})`);

    // Transition avec animation selon le type
    if (newModel.type === 'obj') {
      await this.transitionToNewModel(newModel.meshGroup);
      this.currentMeshGroup = newModel.meshGroup;
    } else {
      await this.transitionToNewModel(newModel.mesh);
      this.currentMeshGroup = null;
    }

    this.currentModelIndex = index;
    
    // Auto-fit du nouveau modèle
    const meshToFit = newModel.type === 'obj' ? newModel.meshGroup : newModel.mesh;
    if (this.autoFitCallback && meshToFit) {
      this.autoFitCallback(meshToFit);
    }

    window.dispatchEvent(new CustomEvent("multiSTL:switched", {
      detail: { 
        index, 
        name: newModel.name,
        total: this.models.length
      }
    }));

    return true;
  }

  /**
   * Transition animée entre modèles
   */
  async transitionToNewModel(newMesh) {
    const oldMesh = this.currentMesh;
    
    // Fade out ancien modèle
    if (oldMesh) {
      await this.fadeOutMesh(oldMesh);
      this.root.remove(oldMesh);
    }

    // Ajouter et fade in nouveau modèle
    this.root.add(newMesh);
    this.currentMesh = newMesh;
    
    await this.fadeInMesh(newMesh);
  }

  /**
   * Animation fade out
   */
  fadeOutMesh(mesh) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.transitionDuration / 2;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale down + rotation
        const scale = 0.05 * (1 - progress);  // 0.02→0.05
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.y += 0.1;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Animation fade in
   */
  fadeInMesh(mesh) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = this.transitionDuration / 2;
      
      // Commencer petit
      mesh.scale.set(0, 0, 0);
      mesh.rotation.y = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        
        // Scale up
        const scale = 0.05 * eased;  // 0.02→0.05
        mesh.scale.set(scale, scale, scale);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  /**
   * Applique l'explosion au modèle actuel
   * @param {number} factor - Facteur d'explosion (0.0 à 1.0)
   */
  applyExplosion(factor) {
    const currentModel = this.models[this.currentModelIndex];
    if (!currentModel || !currentModel.loaded) return;

    if (currentModel.type === 'obj' && currentModel.hasMultipleParts) {
      // OBJ avec plusieurs parties : éclater chaque mesh
      let appliedCount = 0;
      
      // EXPLOSION LINÉAIRE : modifier SEULEMENT l'axe principal
      const mainAxis = currentModel.mainAxis || 'y';
      const totalMeshes = currentModel.meshes.length;
      // Espacement adaptatif : GRANDE valeur par défaut pour vue technique
      let spacing = 8.0;  // Espacement par défaut (6 → 8)
      if (totalMeshes > 50) spacing = 5.0;  // Beaucoup de pièces → espacement réduit
      else if (totalMeshes > 20) spacing = 10.0;  // Moyennement → espacement très grand
      else if (totalMeshes <= 5) spacing = 12.0; // Peu de pièces → espacement énorme
      else spacing = 8.0; // 6-20 pièces → espacement grand
      
      // Log seulement si changement (pas à chaque frame)
      if (factor > 0.1 && !this._lastLoggedFactor) {
        console.log(`🔧 Explosion: ${totalMeshes} meshes, spacing=${spacing}, axis=${mainAxis.toUpperCase()}, spread=${(totalMeshes-1)*spacing} units`);
      }
      
      currentModel.meshes.forEach((mesh, idx) => {
        const initialLocalPos = mesh.userData.initialLocalPosition;
        const sortedIndex = mesh.userData.sortedIndex;
        const totalMeshes = mesh.userData.totalMeshes;
        
        if (!initialLocalPos || sortedIndex === undefined) {
          return;
        }
        
        // EXPLOSION LINÉAIRE : offset sur l'axe principal seulement
        // Centré autour de 0, espacé régulièrement
        const centerOffset = (totalMeshes - 1) / 2.0;
        const targetAxisPosition = (sortedIndex - centerOffset) * spacing;
        
        // Calculer l'offset à appliquer (position cible - position initiale)
        const initialAxisPos = initialLocalPos[mainAxis];
        const offsetAxis = (targetAxisPosition - initialAxisPos) * factor;
        
        // IMPORTANT : Garder les positions initiales et ajouter seulement l'offset sur l'axe
        mesh.position.copy(initialLocalPos);
        mesh.position[mainAxis] = initialAxisPos + offsetAxis;
        
        appliedCount++;
        
        // Log détaillé des premières pièces
        if (factor > 0.3 && idx < 3 && !this._detailedLogged) {
          console.log(`💥 Mesh ${idx}: sortedIdx=${sortedIndex}, ${mainAxis}: ${initialAxisPos.toFixed(2)} → ${mesh.position[mainAxis].toFixed(2)} (target=${targetAxisPosition.toFixed(2)})`);
          if (idx === 2) {
            console.log(`📊 Total: ${totalMeshes} meshes, axis=${mainAxis.toUpperCase()}, spacing=${spacing}, spread=${((totalMeshes-1) * spacing).toFixed(1)} units`);
            this._detailedLogged = true;
          }
        }
      });
      
      if (factor < 0.1) {
        this._detailedLogged = false;
      }
      
      // Log uniquement quand explosion active
      if (factor > 0.1 && !this._lastLoggedFactor) {
        console.log(`💥 OBJ Explosion applied to ${appliedCount}/${currentModel.meshes.length} meshes (factor=${factor.toFixed(2)})`);
        this._lastLoggedFactor = true;
      } else if (factor < 0.05) {
        this._lastLoggedFactor = false;
      }
    } else if (currentModel.mesh && currentModel.mesh.userData.applyExplosion) {
      // STL : explosion basique des vertices
      currentModel.mesh.userData.applyExplosion(factor);
    }
  }

  /**
   * Obtient la liste des modèles
   */
  getModelsList() {
    return this.models.map((model, index) => ({
      index,
      id: model.id,
      name: model.name,
      path: model.path,
      type: model.type,
      hasMultipleParts: model.hasMultipleParts,
      loaded: model.loaded,
      isCurrent: index === this.currentModelIndex
    }));
  }

  /**
   * Obtient le modèle actuel
   */
  getCurrentModel() {
    return this.models[this.currentModelIndex] || null;
  }

  /**
   * Obtient le mesh actuel (ou group pour OBJ)
   */
  getCurrentMesh() {
    const currentModel = this.models[this.currentModelIndex];
    if (currentModel && currentModel.type === 'obj') {
      return currentModel.meshGroup;
    }
    return this.currentMesh;
  }
  
  /**
   * Obtient tous les meshes du modèle actuel (pour raycasting laser)
   */
  getCurrentMeshes() {
    const currentModel = this.models[this.currentModelIndex];
    if (currentModel && currentModel.type === 'obj') {
      return currentModel.meshes || [];
    }
    return this.currentMesh ? [this.currentMesh] : [];
  }

  /**
   * Nettoyage
   */
  dispose() {
    // Supprimer le mesh actuel
    if (this.currentMesh) {
      this.root.remove(this.currentMesh);
    }

    // Nettoyer toutes les géométries
    this.models.forEach(model => {
      if (model.geometry) {
        model.geometry.dispose();
      }
      if (model.mesh) {
        model.mesh.geometry.dispose();
      }
    });

    this.models = [];
    this.currentMesh = null;
    
    console.log("📚 MultiSTLManager disposed");
  }
}

/**
 * Contrôleur de galerie UI
 */
export class STLGalleryController {
  constructor(multiSTLManager) {
    this.manager = multiSTLManager;
    this.setupHotkeys();
  }

  /**
   * Raccourcis clavier
   */
  setupHotkeys() {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'arrowright':
        case 'd':
          this.manager.nextModel();
          break;
        case 'arrowleft':
        case 'a':
          this.manager.previousModel();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    this.cleanup = () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }

  /**
   * Nettoyage
   */
  dispose() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}
