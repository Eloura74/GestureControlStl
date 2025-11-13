/**
 * SmartExplosion.js - Système d'explosion intelligente avec étiquettes et connexions
 * Analyse automatiquement les sous-parties du modèle
 */

import * as THREE from 'three';

export class SmartExplosion {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.parts = []; // Liste des parties détectées
    this.labels = []; // Étiquettes HTML
    this.connections = []; // Lignes de connexion
    this.explosionFactor = 0;
    this.animationProgress = 0;
    this.isAnimating = false;
    this.sequenceDelay = 0.05; // Délai entre chaque pièce
    
    // Groupe pour les lignes de connexion
    this.connectionGroup = new THREE.Group();
    this.connectionGroup.visible = false;
    this.scene.add(this.connectionGroup);
    
    // Container pour les étiquettes
    this.labelContainer = this.createLabelContainer();
  }
  
  createLabelContainer() {
    const container = document.createElement('div');
    container.id = 'explosion-labels';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '100';
    document.body.appendChild(container);
    return container;
  }
  
  /**
   * Analyse un modèle et détecte les sous-parties
   */
  analyzeModel(model) {
    this.reset();
    
    if (!model) return;
    
    const parts = [];
    let partIndex = 0;
    
    model.traverse((child) => {
      if (child.isMesh) {
        // Calculer le centre de chaque mesh
        const bbox = new THREE.Box3().setFromObject(child);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        
        // Direction d'explosion (depuis le centre du modèle)
        const modelCenter = new THREE.Vector3();
        new THREE.Box3().setFromObject(model).getCenter(modelCenter);
        
        const direction = center.clone().sub(modelCenter).normalize();
        if (direction.length() === 0) {
          direction.set(0, 1, 0); // Défaut vers le haut
        }
        
        // Nom de la pièce
        const partName = child.name || `Part ${partIndex + 1}`;
        
        parts.push({
          mesh: child,
          center: center,
          direction: direction,
          originalPosition: child.position.clone(),
          name: partName,
          index: partIndex,
          bbox: bbox
        });
        
        partIndex++;
      }
    });
    
    this.parts = parts;
    console.log(`🔍 Analyse: ${parts.length} parties détectées`);
    
    // Créer les étiquettes
    this.createLabels();
    
    // Créer les lignes de connexion
    this.createConnections();
    
    return parts;
  }
  
  /**
   * Crée les étiquettes HTML pour chaque pièce
   */
  createLabels() {
    // Nettoyer les anciennes
    this.labelContainer.innerHTML = '';
    this.labels = [];
    
    this.parts.forEach(part => {
      const label = document.createElement('div');
      label.className = 'explosion-label';
      label.textContent = part.name;
      label.style.cssText = `
        position: absolute;
        background: rgba(0, 255, 255, 0.9);
        color: #000;
        padding: 5px 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        font-weight: bold;
        pointer-events: none;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        border: 1px solid #00ffff;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      
      this.labelContainer.appendChild(label);
      this.labels.push({
        element: label,
        part: part
      });
    });
  }
  
  /**
   * Crée les lignes de connexion entre pièces proches
   */
  createConnections() {
    // Nettoyer les anciennes
    this.connectionGroup.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    this.connectionGroup.clear();
    this.connections = [];
    
    // Trouver les pièces proches
    const maxDistance = 2.0; // Distance max pour connexion
    
    for (let i = 0; i < this.parts.length; i++) {
      for (let j = i + 1; j < this.parts.length; j++) {
        const part1 = this.parts[i];
        const part2 = this.parts[j];
        
        const dist = part1.center.distanceTo(part2.center);
        
        if (dist < maxDistance) {
          // Créer une ligne
          const points = [part1.center.clone(), part2.center.clone()];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineDashedMaterial({
            color: 0x00ffff,
            linewidth: 2,
            dashSize: 0.1,
            gapSize: 0.05,
            transparent: true,
            opacity: 0.6
          });
          
          const line = new THREE.Line(geometry, material);
          line.computeLineDistances();
          
          this.connectionGroup.add(line);
          this.connections.push({
            line: line,
            part1: part1,
            part2: part2,
            geometry: geometry
          });
        }
      }
    }
    
    console.log(`🔗 ${this.connections.length} connexions créées`);
  }
  
  /**
   * Explosion avec animation séquencée
   */
  setExplosion(factor, animated = false) {
    this.explosionFactor = Math.max(0, Math.min(1, factor));
    
    if (animated && !this.isAnimating) {
      this.startAnimation();
    } else if (!animated) {
      this.applyExplosion(this.explosionFactor);
    }
  }
  
  /**
   * Démarre l'animation séquencée
   */
  startAnimation() {
    this.isAnimating = true;
    this.animationProgress = 0;
  }
  
  /**
   * Update - appelé chaque frame
   */
  update(deltaTime) {
    // Animation séquencée
    if (this.isAnimating) {
      this.animationProgress += deltaTime * 2.0; // Vitesse animation
      
      if (this.animationProgress >= 1.0) {
        this.animationProgress = 1.0;
        this.isAnimating = false;
      }
      
      this.applyExplosionSequenced(this.explosionFactor, this.animationProgress);
    }
    
    // Mettre à jour les positions des étiquettes
    this.updateLabels();
    
    // Mettre à jour les lignes de connexion
    this.updateConnections();
  }
  
  /**
   * Applique l'explosion immédiatement
   */
  applyExplosion(factor) {
    this.parts.forEach(part => {
      const offset = part.direction.clone().multiplyScalar(factor * 3.0);
      part.mesh.position.copy(part.originalPosition).add(offset);
    });
  }
  
  /**
   * Applique l'explosion de manière séquencée
   */
  applyExplosionSequenced(targetFactor, progress) {
    this.parts.forEach((part, index) => {
      // Délai pour chaque pièce
      const delay = index * this.sequenceDelay;
      const partProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
      
      // Easing out cubic
      const eased = 1 - Math.pow(1 - partProgress, 3);
      
      const factor = targetFactor * eased;
      const offset = part.direction.clone().multiplyScalar(factor * 3.0);
      part.mesh.position.copy(part.originalPosition).add(offset);
    });
  }
  
  /**
   * Met à jour les positions des étiquettes en 2D
   */
  updateLabels() {
    const showLabels = this.explosionFactor > 0.3;
    
    this.labels.forEach(labelData => {
      const part = labelData.part;
      const label = labelData.element;
      
      // Position 3D de la pièce
      const worldPos = new THREE.Vector3();
      part.mesh.getWorldPosition(worldPos);
      
      // Projection 2D
      const screenPos = worldPos.clone().project(this.camera);
      
      // Convertir en coordonnées écran
      const x = (screenPos.x + 1) * window.innerWidth / 2;
      const y = (-screenPos.y + 1) * window.innerHeight / 2;
      
      // Vérifier si visible
      const isVisible = screenPos.z < 1 && showLabels;
      
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.opacity = isVisible ? '1' : '0';
    });
  }
  
  /**
   * Met à jour les lignes de connexion
   */
  updateConnections() {
    this.connectionGroup.visible = this.explosionFactor > 0.1;
    
    this.connections.forEach(conn => {
      // Mettre à jour les positions
      const pos1 = new THREE.Vector3();
      const pos2 = new THREE.Vector3();
      
      conn.part1.mesh.getWorldPosition(pos1);
      conn.part2.mesh.getWorldPosition(pos2);
      
      const points = [pos1, pos2];
      conn.geometry.setFromPoints(points);
      conn.line.computeLineDistances();
      
      // Fade basé sur l'explosion
      conn.line.material.opacity = 0.6 * Math.min(1, this.explosionFactor * 2);
    });
  }
  
  /**
   * Reset complet
   */
  reset() {
    this.parts = [];
    this.labels = [];
    this.connections.forEach(conn => {
      if (conn.geometry) conn.geometry.dispose();
      if (conn.line.material) conn.line.material.dispose();
    });
    this.connections = [];
    this.connectionGroup.clear();
    this.labelContainer.innerHTML = '';
    this.explosionFactor = 0;
    this.animationProgress = 0;
    this.isAnimating = false;
  }
  
  /**
   * Nettoyer les ressources
   */
  dispose() {
    this.reset();
    this.scene.remove(this.connectionGroup);
    if (this.labelContainer.parentNode) {
      this.labelContainer.parentNode.removeChild(this.labelContainer);
    }
  }
}
