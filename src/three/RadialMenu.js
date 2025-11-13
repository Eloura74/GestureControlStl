/**
 * RadialMenu.js - Menu circulaire 3D activé par geste paume ouverte
 * Affiche des options en cercle avec icônes et sélection par pointage
 */

import * as THREE from 'three';

export class RadialMenu {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.isVisible = false;
    this.group = new THREE.Group();
    this.items = [];
    this.selectedIndex = -1;
    this.activationTime = 0;
    this.fadeProgress = 0;
    
    // Configuration
    this.radius = 2.0;
    this.itemSize = 0.4;
    this.colors = {
      idle: new THREE.Color(0x00ffff),
      hover: new THREE.Color(0xffff00),
      selected: new THREE.Color(0x00ff00)
    };
    
    this._createMenu();
    this.group.visible = false;
    this.scene.add(this.group);
  }
  
  _createMenu() {
    // Définir les options du menu
    const menuOptions = [
      { name: 'Reset', icon: '↻', action: 'reset' },
      { name: 'Model 1', icon: '1', action: 'model_0' },
      { name: 'Model 2', icon: '2', action: 'model_1' },
      { name: 'Model 3', icon: '3', action: 'model_2' },
      { name: 'Analyze', icon: '📊', action: 'analyze' },
      { name: 'Explode', icon: '💥', action: 'explode' },
      { name: 'Freeze', icon: '❄️', action: 'freeze' },
      { name: 'Record', icon: '⏺', action: 'record' }
    ];
    
    const numItems = menuOptions.length;
    const angleStep = (Math.PI * 2) / numItems;
    
    menuOptions.forEach((option, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start at top
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      
      const item = this._createMenuItem(option, x, y, angle);
      this.items.push({
        mesh: item.group,
        label: item.label,
        option: option,
        angle: angle,
        index: i
      });
      this.group.add(item.group);
    });
    
    // Cercle central
    const centerGeo = new THREE.CircleGeometry(0.3, 32);
    const centerMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const centerCircle = new THREE.Mesh(centerGeo, centerMat);
    this.group.add(centerCircle);
    this.centerCircle = centerCircle;
  }
  
  _createMenuItem(option, x, y, angle) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);
    
    // Background circle
    const bgGeo = new THREE.CircleGeometry(this.itemSize, 32);
    const bgMat = new THREE.MeshBasicMaterial({
      color: this.colors.idle,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    group.add(bg);
    
    // Border ring
    const ringGeo = new THREE.RingGeometry(this.itemSize * 0.95, this.itemSize, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);
    
    // Text label (simple plane for now - will use canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(option.icon, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const labelMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.z = 0.01;
    group.add(label);
    
    // Store references
    group.userData = { bg, ring, label, option, bgMat, ringMat };
    
    return { group, label };
  }
  
  /**
   * Show menu at position (screen space or world space)
   */
  show(position = null) {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.activationTime = performance.now();
    this.fadeProgress = 0;
    
    // Position menu in front of camera
    if (position) {
      this.group.position.copy(position);
    } else {
      const forward = new THREE.Vector3(0, 0, -4);
      forward.applyQuaternion(this.camera.quaternion);
      this.group.position.copy(this.camera.position).add(forward);
    }
    
    // Face camera
    this.group.quaternion.copy(this.camera.quaternion);
    
    this.group.visible = true;
    console.log('🎯 Menu radial activé');
  }
  
  /**
   * Hide menu
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.group.visible = false;
    this.selectedIndex = -1;
    this._resetItemStates();
    console.log('🎯 Menu radial désactivé');
  }
  
  /**
   * Update menu - handle pointer direction for selection
   * @param {Object} pointerInfo - { x, y, z } normalized direction from hand
   */
  update(deltaTime, pointerInfo = null) {
    if (!this.isVisible) return null;
    
    // Fade-in animation
    if (this.fadeProgress < 1.0) {
      this.fadeProgress = Math.min(1.0, this.fadeProgress + deltaTime * 3.0);
      this._updateFade(this.fadeProgress);
    }
    
    // Always face camera
    this.group.quaternion.copy(this.camera.quaternion);
    
    // Selection logic
    let selectedAction = null;
    
    if (pointerInfo) {
      // Convert pointer direction to menu angle
      const angle = Math.atan2(pointerInfo.y, pointerInfo.x);
      const bestMatch = this._findClosestItem(angle);
      
      if (bestMatch !== this.selectedIndex) {
        this._resetItemStates();
        this.selectedIndex = bestMatch;
        
        if (bestMatch >= 0) {
          this._highlightItem(bestMatch);
        }
      }
      
      // Detect selection (pointer held for 0.5s)
      if (bestMatch >= 0 && this.items[bestMatch].hoverTime > 0.5) {
        selectedAction = this.items[bestMatch].option.action;
        this.hide();
      }
    } else {
      this._resetItemStates();
      this.selectedIndex = -1;
    }
    
    // Update hover timers
    this.items.forEach((item, i) => {
      if (i === this.selectedIndex) {
        item.hoverTime = (item.hoverTime || 0) + deltaTime;
      } else {
        item.hoverTime = 0;
      }
    });
    
    return selectedAction;
  }
  
  _findClosestItem(angle) {
    let minDiff = Infinity;
    let closestIdx = -1;
    
    this.items.forEach((item, i) => {
      let diff = Math.abs(angle - item.angle);
      // Handle wrap-around
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      
      if (diff < minDiff && diff < Math.PI / 8) { // 22.5 degree tolerance
        minDiff = diff;
        closestIdx = i;
      }
    });
    
    return closestIdx;
  }
  
  _highlightItem(index) {
    const item = this.items[index];
    const { bgMat, ringMat } = item.mesh.userData;
    
    bgMat.color.copy(this.colors.hover);
    bgMat.opacity = 0.9;
    ringMat.opacity = 1.0;
    
    // Scale animation
    item.mesh.scale.setScalar(1.2);
  }
  
  _resetItemStates() {
    this.items.forEach(item => {
      const { bgMat, ringMat } = item.mesh.userData;
      bgMat.color.copy(this.colors.idle);
      bgMat.opacity = 0.6;
      ringMat.opacity = 0.8;
      item.mesh.scale.setScalar(1.0);
    });
  }
  
  _updateFade(progress) {
    const eased = this._easeOutCubic(progress);
    
    this.items.forEach((item, i) => {
      const delay = i * 0.05;
      const localProgress = Math.max(0, Math.min(1, (eased - delay) / (1 - delay)));
      
      item.mesh.scale.setScalar(localProgress);
      const { bgMat, ringMat, label } = item.mesh.userData;
      bgMat.opacity = 0.6 * localProgress;
      ringMat.opacity = 0.8 * localProgress;
      label.material.opacity = localProgress;
    });
    
    // Center circle
    this.centerCircle.material.opacity = 0.3 * eased;
    this.centerCircle.scale.setScalar(eased);
  }
  
  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  /**
   * Check if menu is currently visible
   */
  get visible() {
    return this.isVisible;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.items.forEach(item => {
      item.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    });
    
    this.scene.remove(this.group);
  }
}
