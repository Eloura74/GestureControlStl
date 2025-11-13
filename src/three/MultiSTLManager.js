/**
 * MULTI-STL MANAGER - Système de galerie et swap de modèles
 * Permet de charger et basculer entre plusieurs modèles STL
 */

import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

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
    this.loader = new STLLoader();
    this.isLoading = false;
    this.transitionDuration = 800; // ms
    
    console.log("📚 MultiSTLManager initialized");
  }

  /**
   * Ajoute un modèle à la galerie
   */
  addModel(path, name = null) {
    const modelName = name || path.split('/').pop().replace('.stl', '');
    
    this.models.push({
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      path: path,
      name: modelName,
      mesh: null,
      geometry: null,
      loaded: false
    });
    
    console.log(`➕ Model added: ${modelName} (${this.models.length} total)`);
    
    return this.models.length - 1;
  }

  /**
   * Charge un modèle STL
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
    
    return new Promise((resolve, reject) => {
      this.loader.load(
        model.path,
        (geometry) => {
          geometry.computeVertexNormals();
          geometry.center();
          
          const mesh = new THREE.Mesh(geometry, this.material);
          mesh.scale.set(0.05, 0.05, 0.05);  // 0.02→0.05 : Plus grand pour être visible
          
          // Stocker vertices originaux pour explosion
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
          
          this.isLoading = false;
          
          console.log(`✅ Model loaded: ${model.name}`);
          
          window.dispatchEvent(new CustomEvent("multiSTL:loaded", {
            detail: { index, name: model.name }
          }));
          
          resolve(true);
        },
        undefined,
        (err) => {
          console.error(`❌ Failed to load model: ${model.name}`, err);
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
    
    console.log(`🔄 Switching to model: ${newModel.name}`);

    // Transition avec animation
    await this.transitionToNewModel(newModel.mesh);

    this.currentModelIndex = index;
    
    // Auto-fit du nouveau modèle
    if (this.autoFitCallback && this.currentMesh) {
      this.autoFitCallback(this.currentMesh);
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
   * Obtient la liste des modèles
   */
  getModelsList() {
    return this.models.map((model, index) => ({
      index,
      id: model.id,
      name: model.name,
      path: model.path,
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
   * Obtient le mesh actuel
   */
  getCurrentMesh() {
    return this.currentMesh;
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
