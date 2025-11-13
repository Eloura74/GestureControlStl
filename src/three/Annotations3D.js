/**
 * Annotations3D.js - Système d'annotations 3D pour documentation technique
 * Placement de notes, flèches, mesures sur le modèle
 */

import * as THREE from 'three';

export class Annotations3D {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.annotations = [];
    this.isPlacementMode = false;
    this.currentType = 'note'; // note, arrow, measure
    
    // Container HTML pour les annotations
    this.container = this.createContainer();
    
    // Raycaster pour détection clics
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Groupe pour les éléments 3D
    this.annotationGroup = new THREE.Group();
    this.scene.add(this.annotationGroup);
    
    // Point de mesure temporaire
    this.measurePoints = [];
    
    console.log('📝 Annotations3D initialized');
  }
  
  createContainer() {
    const container = document.createElement('div');
    container.id = 'annotations-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 200;
    `;
    document.body.appendChild(container);
    return container;
  }
  
  /**
   * Active/désactive le mode placement
   */
  togglePlacementMode(type = 'note') {
    // Si type est null, désactiver le mode
    if (type === null) {
      this.isPlacementMode = false;
      this.currentType = null;
      console.log('📍 Mode placement désactivé');
      document.body.style.cursor = 'default';
      this.measurePoints = [];
      return false;
    }
    
    // Si même type, toggle off
    if (this.currentType === type && this.isPlacementMode) {
      this.isPlacementMode = false;
      this.currentType = null;
      console.log('📍 Mode placement désactivé');
      document.body.style.cursor = 'default';
      this.measurePoints = [];
      return false;
    }
    
    // Sinon, activer avec le nouveau type
    this.isPlacementMode = true;
    this.currentType = type;
    console.log(`📍 Mode placement activé: ${type}`);
    document.body.style.cursor = 'crosshair';
    
    return true;
  }
  
  /**
   * Gère le clic pour placer une annotation
   */
  handleClick(event, model) {
    if (!this.isPlacementMode || !model) return null;
    
    // Calculer position souris normalisée
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Raycast - S'assurer que les matrices sont à jour
    model.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(model, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const intersectedMesh = intersects[0].object;
      
      console.log(`🎯 Intersection: mesh="${intersectedMesh.name}", point=(${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)})`);
      
      // Récupérer la normale (peut être null pour certains meshes)
      let normal = new THREE.Vector3(0, 1, 0); // Défaut vers le haut
      if (intersects[0].face && intersects[0].face.normal) {
        normal = intersects[0].face.normal.clone();
        // Transformer dans l'espace monde
        normal.transformDirection(intersectedMesh.matrixWorld);
        normal.normalize();
      }
      
      if (this.currentType === 'note') {
        return this.addNoteAnnotation(point, normal, model);
      } else if (this.currentType === 'arrow') {
        return this.addArrowAnnotation(point, normal, model);
      } else if (this.currentType === 'measure') {
        return this.addMeasurePoint(point, model);
      }
    } else {
      console.warn('⚠️ Aucune intersection détectée');
    }
    
    return null;
  }
  
  /**
   * Calcule le scale facteur du modèle (pour ajuster taille annotations)
   */
  getModelScale(model) {
    if (!model) return 1.0;
    
    // Récupérer le scale moyen du modèle parent
    let avgScale = 1.0;
    if (model.scale) {
      avgScale = (model.scale.x + model.scale.y + model.scale.z) / 3;
    }
    
    return avgScale;
  }
  
  /**
   * Ajoute une annotation note
   */
  addNoteAnnotation(position, normal, model) {
    const id = `note-${Date.now()}`;
    const text = prompt('Texte de la note:', 'Note importante') || 'Note';
    
    // Ajuster taille selon scale du modèle (OBJ vs STL)
    const modelScale = this.getModelScale(model);
    // Utiliser un facteur TRÈS petit pour éviter annotations géantes
    const sizeFactor = 0.008 / Math.max(modelScale, 1.0); // 0.02 → 0.008 (division par 2.5)
    const lineLength = 0.06 / Math.max(modelScale, 1.0);  // 0.15 → 0.06 (division par 2.5)
    
    console.log(`📝 Scale modèle: ${modelScale.toFixed(2)}, sizeFactor: ${sizeFactor.toFixed(5)}`);
    
    // Marqueur 3D
    const markerGeometry = new THREE.SphereGeometry(sizeFactor, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    
    // Ligne vers l'extérieur
    const lineEnd = position.clone().add(normal.multiplyScalar(lineLength));
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      position,
      lineEnd
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    
    this.annotationGroup.add(marker);
    this.annotationGroup.add(line);
    
    // Label HTML
    const label = this.createLabel(text, 'note');
    
    const annotation = {
      id: id,
      type: 'note',
      position: position,
      normal: normal,
      text: text,
      marker: marker,
      line: line,
      label: label,
      lineEnd: lineEnd
    };
    
    this.annotations.push(annotation);
    console.log(`📝 Note ajoutée: "${text}"`);
    
    return annotation;
  }
  
  /**
   * Ajoute une annotation flèche
   */
  addArrowAnnotation(position, normal, model) {
    const id = `arrow-${Date.now()}`;
    const text = prompt('Description:', 'Zone importante') || 'Important';
    
    // Ajuster taille selon scale du modèle
    const modelScale = this.getModelScale(model);
    // Réduire encore plus la flèche pour correspondre aux autres annotations
    const arrowLength = 0.04 / Math.max(modelScale, 1.0);      // 0.08 → 0.04 (encore divisé par 2)
    const arrowHeadLength = 0.015 / Math.max(modelScale, 1.0); // 0.03 → 0.015 (divisé par 2)
    const arrowHeadWidth = 0.008 / Math.max(modelScale, 1.0);  // 0.015 → 0.008 (divisé par 2)
    
    console.log(`➡️ Scale modèle: ${modelScale.toFixed(2)}, arrowLength: ${arrowLength.toFixed(5)}`);
    
    // Flèche 3D
    const arrowDir = normal.clone().normalize();
    const arrowHelper = new THREE.ArrowHelper(
      arrowDir,
      position,
      arrowLength,
      0xff0000,
      arrowHeadLength,
      arrowHeadWidth
    );
    
    this.annotationGroup.add(arrowHelper);
    
    // Label HTML
    const label = this.createLabel(text, 'arrow');
    
    const annotation = {
      id: id,
      type: 'arrow',
      position: position,
      normal: normal,
      text: text,
      arrow: arrowHelper,
      label: label,
      arrowLength: arrowLength  // Stocker la longueur pour update()
    };
    
    this.annotations.push(annotation);
    console.log(`➡️ Flèche ajoutée: "${text}"`);
    
    return annotation;
  }
  
  /**
   * Ajoute un point de mesure
   */
  addMeasurePoint(position, model) {
    this.measurePoints.push(position.clone());
    
    // Ajuster taille selon scale du modèle
    const modelScale = this.getModelScale(model);
    const markerSize = 0.008 / Math.max(modelScale, 1.0); // 0.02 → 0.008 (division par 2.5)
    
    console.log(`📏 Scale modèle: ${modelScale.toFixed(2)}, markerSize: ${markerSize.toFixed(5)}`);
    
    // Marqueur
    const markerGeometry = new THREE.SphereGeometry(markerSize, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(position);
    this.annotationGroup.add(marker);
    
    // Si 2 points, créer la mesure
    if (this.measurePoints.length === 2) {
      const distance = this.measurePoints[0].distanceTo(this.measurePoints[1]);
      const id = `measure-${Date.now()}`;
      
      // Ligne de mesure
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(this.measurePoints);
      const lineMaterial = new THREE.LineDashedMaterial({
        color: 0x00ff00,
        linewidth: 2,
        dashSize: 0.05,
        gapSize: 0.02
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.computeLineDistances();
      this.annotationGroup.add(line);
      
      // Label avec distance
      const midPoint = new THREE.Vector3()
        .addVectors(this.measurePoints[0], this.measurePoints[1])
        .multiplyScalar(0.5);
      
      const label = this.createLabel(`${distance.toFixed(3)} u`, 'measure');
      
      const annotation = {
        id: id,
        type: 'measure',
        point1: this.measurePoints[0].clone(),
        point2: this.measurePoints[1].clone(),
        distance: distance,
        line: line,
        marker1: this.annotationGroup.children[this.annotationGroup.children.length - 2],
        marker2: marker,
        label: label,
        midPoint: midPoint
      };
      
      this.annotations.push(annotation);
      console.log(`📏 Mesure ajoutée: ${distance.toFixed(3)} unités`);
      
      // Reset pour nouvelle mesure
      this.measurePoints = [];
      
      return annotation;
    }
    
    return null;
  }
  
  /**
   * Crée un label HTML
   */
  createLabel(text, type) {
    const label = document.createElement('div');
    label.className = `annotation-label annotation-${type}`;
    
    const colors = {
      note: { bg: 'rgba(255, 255, 0, 0.9)', border: '#ffff00' },
      arrow: { bg: 'rgba(255, 0, 0, 0.9)', border: '#ff0000' },
      measure: { bg: 'rgba(0, 255, 0, 0.9)', border: '#00ff00' }
    };
    
    const color = colors[type] || colors.note;
    
    label.style.cssText = `
      position: absolute;
      background: ${color.bg};
      color: #000;
      padding: 5px 10px;
      border-radius: 5px;
      border: 2px solid ${color.border};
      font-family: monospace;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px ${color.border};
      pointer-events: auto;
      cursor: pointer;
      z-index: 1000;
    `;
    
    label.textContent = text;
    
    // Bouton supprimer
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = ' ✕';
    deleteBtn.style.cssText = `
      margin-left: 8px;
      color: #000;
      font-weight: bold;
      cursor: pointer;
    `;
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.removeAnnotation(label._annotationId);
    };
    label.appendChild(deleteBtn);
    
    this.container.appendChild(label);
    
    return label;
  }
  
  /**
   * Met à jour les positions des labels
   */
  update() {
    this.annotations.forEach(annotation => {
      let worldPos;
      
      if (annotation.type === 'measure') {
        worldPos = annotation.midPoint;
      } else if (annotation.type === 'note') {
        worldPos = annotation.lineEnd;
      } else if (annotation.type === 'arrow') {
        // Utiliser la vraie longueur de la flèche (pas 0.5 fixe)
        const length = annotation.arrowLength || 0.5;
        worldPos = annotation.position.clone().add(
          annotation.normal.clone().multiplyScalar(length)
        );
      } else {
        worldPos = annotation.position.clone().add(
          annotation.normal.clone().multiplyScalar(0.5)
        );
      }
      
      // Projection 2D
      const screenPos = worldPos.clone().project(this.camera);
      
      // Coordonnées écran
      const x = (screenPos.x + 1) * window.innerWidth / 2;
      const y = (-screenPos.y + 1) * window.innerHeight / 2;
      
      // Visibilité
      const isVisible = screenPos.z < 1;
      
      annotation.label.style.left = `${x}px`;
      annotation.label.style.top = `${y}px`;
      annotation.label.style.opacity = isVisible ? '1' : '0';
      annotation.label.style.pointerEvents = isVisible ? 'auto' : 'none';
    });
  }
  
  /**
   * Supprime une annotation
   */
  removeAnnotation(id) {
    const index = this.annotations.findIndex(a => a.id === id);
    if (index === -1) return;
    
    const annotation = this.annotations[index];
    
    // Supprimer les objets 3D
    if (annotation.marker) this.annotationGroup.remove(annotation.marker);
    if (annotation.line) this.annotationGroup.remove(annotation.line);
    if (annotation.arrow) this.annotationGroup.remove(annotation.arrow);
    if (annotation.marker1) this.annotationGroup.remove(annotation.marker1);
    if (annotation.marker2) this.annotationGroup.remove(annotation.marker2);
    
    // Supprimer le label HTML
    if (annotation.label.parentNode) {
      annotation.label.parentNode.removeChild(annotation.label);
    }
    
    this.annotations.splice(index, 1);
    console.log(`🗑️ Annotation supprimée: ${id}`);
  }
  
  /**
   * Efface toutes les annotations
   */
  clearAll() {
    this.annotations.forEach(annotation => {
      if (annotation.label.parentNode) {
        annotation.label.parentNode.removeChild(annotation.label);
      }
    });
    
    this.annotationGroup.clear();
    this.annotations = [];
    console.log('🗑️ Toutes les annotations effacées');
  }
  
  /**
   * Export des annotations en JSON
   */
  export() {
    return this.annotations.map(a => ({
      id: a.id,
      type: a.type,
      text: a.text,
      position: a.position ? {
        x: a.position.x,
        y: a.position.y,
        z: a.position.z
      } : null,
      point1: a.point1 ? {
        x: a.point1.x,
        y: a.point1.y,
        z: a.point1.z
      } : null,
      point2: a.point2 ? {
        x: a.point2.x,
        y: a.point2.y,
        z: a.point2.z
      } : null,
      distance: a.distance
    }));
  }
  
  /**
   * Nettoyer les ressources
   */
  dispose() {
    this.clearAll();
    this.scene.remove(this.annotationGroup);
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
