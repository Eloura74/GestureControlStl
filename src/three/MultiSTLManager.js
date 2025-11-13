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
            if (child.isGroup && child !== object) {
              console.log(`  └─ Group: "${child.name}" (children: ${child.children.length})`);
              intermediateGroups.push(child);
            }
            if (child.isMesh) {
              console.log(`  └─ Mesh found: "${child.name}" (vertices: ${child.geometry.attributes.position.count})`);
              meshes.push(child);
            }
          });
          
          // Aplatir : déplacer tous les meshes directement dans object et supprimer les groupes intermédiaires
          meshes.forEach(mesh => {
            // Sauvegarder la matrice world avant de déplacer
            const worldMatrix = mesh.matrixWorld.clone();
            
            // Retirer du parent actuel et ajouter directement à object
            if (mesh.parent !== object) {
              mesh.parent.remove(mesh);
              object.add(mesh);
              
              // Appliquer la transformation world pour conserver la position
              mesh.matrix.copy(worldMatrix);
              mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
            }
          });
          
          // Supprimer les groupes intermédiaires vides
          intermediateGroups.forEach(group => {
            if (group.children.length === 0) {
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
          
          // Déplacer chaque mesh pour centrer l'assemblage à (0,0,0)
          meshes.forEach(mesh => {
            mesh.position.sub(center);
          });
          
          // Réinitialiser complètement les transformations du groupe parent
          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(autoScale, autoScale, autoScale);
          object.quaternion.set(0, 0, 0, 1);
          
          // IMPORTANT : Mettre à jour les matrices après positionnement
          object.updateMatrix();
          object.updateMatrixWorld(true);
          
          console.log(`📍 OBJ Group reset: pos=(0,0,0), rot=(0,0,0), scale=(${autoScale.toFixed(4)})`);

          
          // Recalculer la bounding box APRÈS le centrage
          const finalBox = new THREE.Box3().setFromObject(object);
          const globalCenter = new THREE.Vector3(0, 0, 0); // Le centre est maintenant à l'origine
          
          // Stocker les positions de chaque mesh pour l'explosion
          // IMPORTANT : Calculer depuis le centre de la géométrie, pas la position du mesh
          meshes.forEach((mesh, idx) => {
            // Calculer le centre réel de ce mesh depuis sa géométrie
            mesh.geometry.computeBoundingBox();
            const meshBox = mesh.geometry.boundingBox;
            const meshCenter = new THREE.Vector3();
            meshBox.getCenter(meshCenter);
            
            // Appliquer les transformations du mesh et du parent pour obtenir la position world
            meshCenter.applyMatrix4(mesh.matrixWorld);
            
            // Direction depuis l'origine vers le centre de ce mesh
            const directionFromCenter = meshCenter.clone();
            
            // Si la direction est quasi nulle, utiliser une direction basée sur l'index
            if (directionFromCenter.length() < 0.01) {
              const angle = (idx / meshes.length) * Math.PI * 2;
              directionFromCenter.set(
                Math.cos(angle),
                Math.sin(angle),
                (idx % 2) * 0.5 - 0.25
              );
            }
            
            // Stocker la position locale du mesh (pour le replacer)
            mesh.userData.initialLocalPosition = mesh.position.clone();
            mesh.userData.meshCenterWorld = meshCenter.clone();
            mesh.userData.explodeDirection = directionFromCenter.normalize();
            
            // Garder matrixAutoUpdate = true pour que Three.js prenne en compte les changements de position
            mesh.matrixAutoUpdate = true;
            
            console.log(`  🎯 Mesh "${mesh.name}": center=(${meshCenter.x.toFixed(3)},${meshCenter.y.toFixed(3)},${meshCenter.z.toFixed(3)}), dir=(${directionFromCenter.x.toFixed(2)},${directionFromCenter.y.toFixed(2)},${directionFromCenter.z.toFixed(2)})`);
          });
          
          console.log(`✅ ${meshes.length} meshes ready for explosion`);
          
          // Le groupe parent et les meshes gardent matrixAutoUpdate = true
          object.matrixAutoUpdate = true;
          
          model.meshGroup = object;
          model.meshes = meshes;
          model.loaded = true;
          model.hasMultipleParts = meshes.length > 1;
          
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
      
      currentModel.meshes.forEach((mesh, idx) => {
        const initialLocalPos = mesh.userData.initialLocalPosition;
        const explodeDirection = mesh.userData.explodeDirection;
        
        if (!initialLocalPos || !explodeDirection) {
          if (factor > 0.1 && idx === 0) {
            console.warn("⚠️ No initial data for mesh", mesh.name, {
              hasLocalPos: !!initialLocalPos,
              hasDirection: !!explodeDirection
            });
          }
          return;
        }
        
        const explodeDistance = 2.5; // Distance maximale d'éclatement
        
        // Calculer l'offset d'explosion
        const offset = explodeDirection.clone().multiplyScalar(factor * explodeDistance);
        
        // Appliquer la nouvelle position
        const newPos = initialLocalPos.clone().add(offset);
        mesh.position.set(newPos.x, newPos.y, newPos.z);
        
        appliedCount++;
        
        // Log détaillé pour le premier mesh lors de forte explosion
        if (factor > 0.3 && idx === 0 && !this._detailedLogged) {
          console.log(`💥 Mesh 0 explosion: initial=(${initialLocalPos.x.toFixed(3)},${initialLocalPos.y.toFixed(3)},${initialLocalPos.z.toFixed(3)}), offset=(${offset.x.toFixed(3)},${offset.y.toFixed(3)},${offset.z.toFixed(3)}), final=(${mesh.position.x.toFixed(3)},${mesh.position.y.toFixed(3)},${mesh.position.z.toFixed(3)})`);
          this._detailedLogged = true;
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
