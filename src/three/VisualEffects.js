/**
 * Effets visuels avancés V3.0
 * - Ondes pulsées synchronisées gestes
 * - Halos main
 * - Effets de freeze (givre)
 */

import * as THREE from 'three';

/**
 * Système d'ondes pulsées
 */
export class PulseWaves {
  constructor(scene) {
    this.scene = scene;
    this.waves = [];
    this.maxWaves = 3;
  }

  /**
   * Crée une onde à une position
   */
  createWave(type, intensity = 1.0) {
    // Limite nombre d'ondes
    if (this.waves.length >= this.maxWaves) {
      const oldest = this.waves.shift();
      this.scene.remove(oldest.mesh);
      oldest.geometry.dispose();
      oldest.material.dispose();
    }

    // Géométrie anneau
    const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
    
    // Couleur selon type de geste
    let color;
    switch(type) {
      case 'ZOOM': color = 0x00ffff; break;
      case 'EXPLODE': color = 0xff00ff; break;
      case 'FREEZE': color = 0x00ff00; break;
      default: color = 0xffffff;
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8 * intensity,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Horizontal
    
    this.scene.add(mesh);

    this.waves.push({
      mesh,
      geometry,
      material,
      life: 0,
      maxLife: 1.5,
      initialOpacity: 0.8 * intensity,
      speed: type === 'EXPLODE' ? 3.0 : 1.5
    });
  }

  /**
   * Update ondes (appelé chaque frame)
   */
  update(deltaTime) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i];
      wave.life += deltaTime;

      // Expansion
      const scale = 1 + wave.life * wave.speed;
      wave.mesh.scale.set(scale, scale, 1);

      // Fade out
      const progress = wave.life / wave.maxLife;
      wave.material.opacity = wave.initialOpacity * (1 - progress);

      // Suppression si terminé
      if (wave.life >= wave.maxLife) {
        this.scene.remove(wave.mesh);
        wave.geometry.dispose();
        wave.material.dispose();
        this.waves.splice(i, 1);
      }
    }
  }

  dispose() {
    this.waves.forEach(wave => {
      this.scene.remove(wave.mesh);
      wave.geometry.dispose();
      wave.material.dispose();
    });
    this.waves = [];
  }
}

/**
 * Halo autour de la main détectée
 */
export class HandHalo {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.halo = null;
    this.createHalo();
  }

  createHalo() {
    const geometry = new THREE.RingGeometry(0.3, 0.4, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });

    this.halo = new THREE.Mesh(geometry, material);
    this.halo.visible = false;
    this.scene.add(this.halo);
  }

  /**
   * Met à jour position du halo
   * @param {Object} handPos - {x: 0-1, y: 0-1} position main normalisée
   * @param {number} time - Temps écoulé pour animation
   */
  update(handPos, time) {
    if (!handPos) {
      this.halo.visible = false;
      return;
    }

    this.halo.visible = true;

    // Convertir position 2D écran → 3D world
    const x = (handPos.x * 2 - 1) * 5;
    const y = -(handPos.y * 2 - 1) * 3;
    
    this.halo.position.set(x, y, 2); // Devant caméra
    
    // Animation pulsation
    const pulse = 1 + Math.sin(time * 4) * 0.1;
    this.halo.scale.set(pulse, pulse, 1);
    
    // Rotation lente
    this.halo.rotation.z = time * 0.5;
  }

  dispose() {
    if (this.halo) {
      this.scene.remove(this.halo);
      this.halo.geometry.dispose();
      this.halo.material.dispose();
    }
  }
}

/**
 * Effet de gel (freeze)
 */
export class FreezeEffect {
  constructor(scene) {
    this.scene = scene;
    this.frostOverlay = null;
    this.createFrostOverlay();
  }

  createFrostOverlay() {
    // Particules de givre
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 6;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.frostOverlay = new THREE.Points(particlesGeometry, particlesMaterial);
    this.frostOverlay.visible = false;
    this.scene.add(this.frostOverlay);
  }

  /**
   * Active/désactive effet freeze
   */
  setActive(active, time) {
    if (!this.frostOverlay) return;

    this.frostOverlay.visible = active;
    
    if (active) {
      // Fade in
      this.frostOverlay.material.opacity = Math.min(0.6, time * 2);
      // Rotation lente
      this.frostOverlay.rotation.y = time * 0.2;
    } else {
      this.frostOverlay.material.opacity = 0;
    }
  }

  dispose() {
    if (this.frostOverlay) {
      this.scene.remove(this.frostOverlay);
      this.frostOverlay.geometry.dispose();
      this.frostOverlay.material.dispose();
    }
  }
}

/**
 * Mode spectacle (idle animation avancée)
 */
export class SpectacleMode {
  constructor() {
    this.isActive = false;
    this.idleStartTime = 0;
    this.colorCycleTime = 0;
  }

  /**
   * Active mode spectacle
   */
  activate() {
    this.isActive = true;
    this.colorCycleTime = 0;
  }

  /**
   * Désactive mode spectacle
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * Update mode spectacle
   * @returns {Object} {rotationSpeed, colorShift}
   */
  update(deltaTime) {
    if (!this.isActive) return null;

    this.colorCycleTime += deltaTime;

    return {
      rotationSpeed: 0.005 + Math.sin(this.colorCycleTime * 0.5) * 0.002,
      colorShift: {
        r: Math.sin(this.colorCycleTime * 0.7) * 0.3 + 0.7,
        g: Math.sin(this.colorCycleTime * 0.9 + 2) * 0.3 + 0.7,
        b: Math.sin(this.colorCycleTime * 1.1 + 4) * 0.3 + 0.7
      }
    };
  }
}
