/**
 * PARTICLE SYSTEM - Particules directionnelles réactives
 * Particules qui réagissent aux gestes pour ambiance immersive
 */

import * as THREE from 'three';

export class DirectionalParticleSystem {
  constructor(scene, count = 500) {
    this.scene = scene;
    this.count = count;
    this.particles = null;
    this.velocities = [];
    this.basePositions = [];
    this.currentGesture = 'IDLE';
    this.gestureIntensity = 0;
    
    this.init();
  }

  init() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);

    // Génération positions initiales en sphère autour du modèle
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      // Position sphérique
      const radius = 3 + Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Stocker position de base
      this.basePositions.push(new THREE.Vector3(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      ));

      // Vélocité initiale nulle
      this.velocities.push(new THREE.Vector3(0, 0, 0));

      // Couleur cyan holographique avec variation
      const colorVariation = 0.8 + Math.random() * 0.2;
      colors[i3] = 0.2 * colorVariation;     // R
      colors[i3 + 1] = 0.9 * colorVariation; // G
      colors[i3 + 2] = 1.0 * colorVariation; // B

      // Taille variable
      sizes[i] = 0.03 + Math.random() * 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Matériau avec vertex colors
    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Met à jour les particules selon le geste
   */
  update(deltaTime, gesture = 'IDLE', gestureData = {}) {
    if (!this.particles) return;

    this.currentGesture = gesture;
    const positions = this.particles.geometry.attributes.position.array;

    // Comportement selon le geste
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const basePos = this.basePositions[i];
      const velocity = this.velocities[i];

      let forceX = 0, forceY = 0, forceZ = 0;

      switch (gesture) {
        case 'ROTATE':
          // Rotation circulaire autour du modèle
          const rotSpeed = (gestureData.rotX || 0) + (gestureData.rotY || 0);
          forceX = -positions[i3 + 2] * rotSpeed * 0.5;
          forceZ = positions[i3] * rotSpeed * 0.5;
          forceY = Math.sin(Date.now() * 0.001 + i) * 0.02;
          break;

        case 'ZOOM':
          // Expansion/contraction radiale
          const zoomForce = (gestureData.zoom || 0) * 2;
          const dirX = positions[i3] - 0;
          const dirY = positions[i3 + 1] - 0;
          const dirZ = positions[i3 + 2] - 0;
          const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
          forceX = (dirX / len) * zoomForce;
          forceY = (dirY / len) * zoomForce;
          forceZ = (dirZ / len) * zoomForce;
          break;

        case 'EXPLODE':
          // Explosion radiale violente
          const explodeIntensity = (gestureData.explode || 0);
          const expDirX = positions[i3];
          const expDirY = positions[i3 + 1];
          const expDirZ = positions[i3 + 2];
          const expLen = Math.sqrt(expDirX * expDirX + expDirY * expDirY + expDirZ * expDirZ) || 1;
          forceX = (expDirX / expLen) * explodeIntensity * 0.3;
          forceY = (expDirY / expLen) * explodeIntensity * 0.3;
          forceZ = (expDirZ / expLen) * explodeIntensity * 0.3;
          break;

        case 'FREEZE':
          // Particules figées, retour lent à la position de base
          forceX = (basePos.x - positions[i3]) * 0.02;
          forceY = (basePos.y - positions[i3 + 1]) * 0.02;
          forceZ = (basePos.z - positions[i3 + 2]) * 0.02;
          velocity.multiplyScalar(0.8); // Forte décélération
          break;

        case 'IDLE':
        default:
          // Mouvement brownien subtil + retour à position de base
          forceX = (basePos.x - positions[i3]) * 0.01 + (Math.random() - 0.5) * 0.01;
          forceY = (basePos.y - positions[i3 + 1]) * 0.01 + (Math.random() - 0.5) * 0.01;
          forceZ = (basePos.z - positions[i3 + 2]) * 0.01 + (Math.random() - 0.5) * 0.01;
          velocity.multiplyScalar(0.95); // Décélération douce
          break;
      }

      // Application des forces
      velocity.x += forceX * deltaTime * 60;
      velocity.y += forceY * deltaTime * 60;
      velocity.z += forceZ * deltaTime * 60;

      // Limite de vélocité
      const maxVel = gesture === 'EXPLODE' ? 0.5 : 0.2;
      const velMag = velocity.length();
      if (velMag > maxVel) {
        velocity.multiplyScalar(maxVel / velMag);
      }

      // Mise à jour position
      positions[i3] += velocity.x;
      positions[i3 + 1] += velocity.y;
      positions[i3 + 2] += velocity.z;

      // Contraintes (sphère invisible)
      const dist = Math.sqrt(
        positions[i3] * positions[i3] +
        positions[i3 + 1] * positions[i3 + 1] +
        positions[i3 + 2] * positions[i3 + 2]
      );

      if (dist > 6) {
        const factor = 6 / dist;
        positions[i3] *= factor;
        positions[i3 + 1] *= factor;
        positions[i3 + 2] *= factor;
        velocity.multiplyScalar(0.5); // Rebond amorti
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    // Rotation lente du système entier en IDLE
    if (gesture === 'IDLE') {
      this.particles.rotation.y += deltaTime * 0.05;
    }
  }

  /**
   * Change la couleur dominante des particules
   */
  setColor(r, g, b) {
    if (!this.particles) return;
    
    const colors = this.particles.geometry.attributes.color.array;
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      const variation = 0.8 + Math.random() * 0.2;
      colors[i3] = r * variation;
      colors[i3 + 1] = g * variation;
      colors[i3 + 2] = b * variation;
    }
    this.particles.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Ajuste l'opacité
   */
  setOpacity(opacity) {
    if (!this.particles) return;
    this.particles.material.opacity = opacity;
  }

  /**
   * Nettoyage
   */
  dispose() {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
  }
}

/**
 * Système de gradient volumétrique
 * Fog dynamique qui réagit aux gestes
 */
export class VolumetricGradient {
  constructor(scene) {
    this.scene = scene;
    this.fogDensity = 0.08;
    this.fogColor = new THREE.Color(0x01060C);
    
    // Fog exponentiel
    this.scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);
  }

  /**
   * Met à jour le fog selon le geste
   */
  update(gesture = 'IDLE', intensity = 0) {
    switch (gesture) {
      case 'ROTATE':
        // Fog légèrement plus dense en rotation
        this.scene.fog.density = 0.08 + intensity * 0.01;
        break;

      case 'ZOOM':
        // Fog qui pulse avec le zoom
        this.scene.fog.density = 0.08 + Math.abs(intensity) * 0.02;
        break;

      case 'EXPLODE':
        // Fog qui se dissipe lors de l'explosion
        this.scene.fog.density = 0.08 - intensity * 0.05;
        break;

      case 'FREEZE':
        // Fog plus dense en freeze
        this.scene.fog.density = 0.10;
        break;

      case 'IDLE':
      default:
        // Retour progressif à la normale
        this.scene.fog.density += (0.08 - this.scene.fog.density) * 0.05;
        break;
    }

    // Limites
    this.scene.fog.density = Math.max(0.03, Math.min(0.15, this.scene.fog.density));
  }

  /**
   * Change la couleur du fog
   */
  setColor(color) {
    this.fogColor = new THREE.Color(color);
    this.scene.fog.color = this.fogColor;
  }

  /**
   * Reset à l'état initial
   */
  reset() {
    this.scene.fog.density = 0.08;
  }
}
