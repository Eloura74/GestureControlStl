/**
 * SLICE VIEW MANAGER - Système de coupe dynamique 3D
 * Permet de trancher le modèle avec des plans de coupe
 */

import * as THREE from 'three';

export class SliceViewManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.isEnabled = false;
    this.mode = 'X'; // 'X', 'Y', 'Z'
    
    // Plans de coupe
    this.clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),  // X
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),  // Y
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)   // Z
    ];
    
    // Position du plan de coupe (-1 à 1)
    this.slicePosition = {
      x: 0,
      y: 0,
      z: 0
    };
    
    // Visualisation du plan de coupe
    this.planeMesh = null;
    this.planeHelper = null;
    
    this.init();
  }

  init() {
    // Créer visualisation du plan de coupe
    const planeGeometry = new THREE.PlaneGeometry(4, 4);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    this.planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    this.planeMesh.visible = false;
    this.scene.add(this.planeMesh);

    // Bordure du plan
    const edges = new THREE.EdgesGeometry(planeGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2
    });
    this.planeHelper = new THREE.LineSegments(edges, edgeMaterial);
    this.planeHelper.visible = false;
    this.scene.add(this.planeHelper);

    // Désactiver par défaut
    this.renderer.clippingPlanes = [];
    this.renderer.localClippingEnabled = false;
  }

  /**
   * Active/désactive le mode Slice View
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.renderer.localClippingEnabled = true;
      this.updateClipping();
      this.planeMesh.visible = true;
      this.planeHelper.visible = true;
    } else {
      this.renderer.localClippingEnabled = false;
      this.renderer.clippingPlanes = [];
      this.planeMesh.visible = false;
      this.planeHelper.visible = false;
    }
  }

  /**
   * Change le mode de coupe (X, Y, Z)
   */
  setMode(mode) {
    this.mode = mode.toUpperCase();
    if (this.isEnabled) {
      this.updateClipping();
    }
  }

  /**
   * Cycle entre les modes X/Y/Z
   */
  cycleMode() {
    const modes = ['X', 'Y', 'Z'];
    const currentIndex = modes.indexOf(this.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
    return modes[nextIndex];
  }

  /**
   * Définit la position du plan de coupe
   * @param {number} position - Position normalisée (-1 à 1)
   */
  setSlicePosition(position) {
    position = Math.max(-1, Math.min(1, position));
    this.slicePosition[this.mode.toLowerCase()] = position;
    
    if (this.isEnabled) {
      this.updateClipping();
    }
  }

  /**
   * Déplace le plan de coupe (delta)
   */
  moveSlice(delta) {
    const currentPos = this.slicePosition[this.mode.toLowerCase()];
    this.setSlicePosition(currentPos + delta);
  }

  /**
   * Met à jour les plans de coupe selon le mode actif
   */
  updateClipping() {
    const pos = this.slicePosition[this.mode.toLowerCase()];
    
    switch (this.mode) {
      case 'X':
        this.clippingPlanes[0].constant = pos;
        this.renderer.clippingPlanes = [this.clippingPlanes[0]];
        
        // Positionner visualisation
        this.planeMesh.position.set(pos, 0, 0);
        this.planeMesh.rotation.set(0, Math.PI / 2, 0);
        this.planeHelper.position.copy(this.planeMesh.position);
        this.planeHelper.rotation.copy(this.planeMesh.rotation);
        break;

      case 'Y':
        this.clippingPlanes[1].constant = pos;
        this.renderer.clippingPlanes = [this.clippingPlanes[1]];
        
        this.planeMesh.position.set(0, pos, 0);
        this.planeMesh.rotation.set(Math.PI / 2, 0, 0);
        this.planeHelper.position.copy(this.planeMesh.position);
        this.planeHelper.rotation.copy(this.planeMesh.rotation);
        break;

      case 'Z':
        this.clippingPlanes[2].constant = pos;
        this.renderer.clippingPlanes = [this.clippingPlanes[2]];
        
        this.planeMesh.position.set(0, 0, pos);
        this.planeMesh.rotation.set(0, 0, 0);
        this.planeHelper.position.copy(this.planeMesh.position);
        this.planeHelper.rotation.copy(this.planeMesh.rotation);
        break;
    }

    // Mettre à jour couleur selon position
    const hue = (pos + 1) / 2; // 0 à 1
    this.planeMesh.material.color.setHSL(hue * 0.3, 1.0, 0.5);
    this.planeHelper.material.color.copy(this.planeMesh.material.color);
  }

  /**
   * Contrôle gestuel du slice
   * Déplacement main horizontal = position coupe
   */
  updateFromGesture(handPosition) {
    if (!this.isEnabled || !handPosition) return;

    // Position main normalisée (0-1) → position slice (-1 à 1)
    let slicePos = 0;

    switch (this.mode) {
      case 'X':
        slicePos = (handPosition.x - 0.5) * 2; // 0-1 → -1 à 1
        break;
      case 'Y':
        slicePos = -(handPosition.y - 0.5) * 2; // Inverser Y
        break;
      case 'Z':
        slicePos = (handPosition.z || 0) * 2 - 1;
        break;
    }

    this.setSlicePosition(slicePos);
  }

  /**
   * Reset position à 0
   */
  reset() {
    this.slicePosition = { x: 0, y: 0, z: 0 };
    if (this.isEnabled) {
      this.updateClipping();
    }
  }

  /**
   * Toggle on/off
   */
  toggle() {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  /**
   * Obtient l'état actuel
   */
  getState() {
    return {
      enabled: this.isEnabled,
      mode: this.mode,
      position: this.slicePosition[this.mode.toLowerCase()]
    };
  }

  /**
   * Nettoyage
   */
  dispose() {
    if (this.planeMesh) {
      this.planeMesh.geometry.dispose();
      this.planeMesh.material.dispose();
      this.scene.remove(this.planeMesh);
    }
    if (this.planeHelper) {
      this.planeHelper.geometry.dispose();
      this.planeHelper.material.dispose();
      this.scene.remove(this.planeHelper);
    }
    this.renderer.clippingPlanes = [];
    this.renderer.localClippingEnabled = false;
  }
}

/**
 * Contrôleur clavier pour Slice View
 */
export class SliceViewKeyboardController {
  constructor(sliceManager) {
    this.sliceManager = sliceManager;
    this.keyStates = {};
    this.moveSpeed = 0.02;
    
    this.init();
  }

  init() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(e) {
    this.keyStates[e.key.toLowerCase()] = true;

    // Raccourcis
    switch (e.key.toLowerCase()) {
      case 'x':
        this.sliceManager.setMode('X');
        break;
      case 'y':
        this.sliceManager.setMode('Y');
        break;
      case 'z':
        this.sliceManager.setMode('Z');
        break;
      case 'c':
        this.sliceManager.toggle();
        break;
      case 'v':
        this.sliceManager.cycleMode();
        break;
      case '0':
        this.sliceManager.reset();
        break;
    }
  }

  handleKeyUp(e) {
    this.keyStates[e.key.toLowerCase()] = false;
  }

  /**
   * Mise à jour continue (à appeler dans animation loop)
   */
  update() {
    if (!this.sliceManager.isEnabled) return;

    // Flèches pour déplacer le plan
    if (this.keyStates['arrowleft']) {
      this.sliceManager.moveSlice(-this.moveSpeed);
    }
    if (this.keyStates['arrowright']) {
      this.sliceManager.moveSlice(this.moveSpeed);
    }
    if (this.keyStates['arrowup']) {
      this.sliceManager.moveSlice(this.moveSpeed);
    }
    if (this.keyStates['arrowdown']) {
      this.sliceManager.moveSlice(-this.moveSpeed);
    }
  }

  /**
   * Nettoyage
   */
  dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
