/**
 * LASER POINTER - Rayon laser 3D interactif
 * Pointe des zones du modèle avec l'index
 */

import * as THREE from 'three';

export class LaserPointer {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.laserBeam = null;
    this.laserDot = null;
    this.targetPoint = new THREE.Vector3();
    this.isActive = false;
    this.raycaster = new THREE.Raycaster();
    
    this.init();
  }

  init() {
    // Création du rayon laser (ligne)
    const beamGeometry = new THREE.BufferGeometry();
    const beamPositions = new Float32Array([
      0, 0, 0,  // Point de départ
      0, 0, -10 // Point d'arrivée (sera mis à jour)
    ]);
    beamGeometry.setAttribute('position', new THREE.BufferAttribute(beamPositions, 3));

    // Shader custom pour le laser
    const beamMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x00ff00) }, // Vert laser
        opacity: { value: 0.8 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
          // Effet pulsant le long du rayon
          float pulse = sin(time * 10.0 + vUv.y * 20.0) * 0.3 + 0.7;
          vec3 finalColor = color * pulse;
          
          // Fade aux extrémités
          float edgeFade = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
          
          gl_FragColor = vec4(finalColor, opacity * edgeFade);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.laserBeam = new THREE.Line(beamGeometry, beamMaterial);
    this.laserBeam.frustumCulled = false;
    this.laserBeam.visible = false;
    this.scene.add(this.laserBeam);

    // Point laser (où le rayon touche)
    const dotGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9
    });
    this.laserDot = new THREE.Mesh(dotGeometry, dotMaterial);
    this.laserDot.visible = false;
    this.scene.add(this.laserDot);

    // Halo autour du point
    const haloGeometry = new THREE.RingGeometry(0.08, 0.15, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.laserHalo = new THREE.Mesh(haloGeometry, haloMaterial);
    this.laserHalo.visible = false;
    this.scene.add(this.laserHalo);
  }

  /**
   * Active/désactive le laser
   */
  setActive(active) {
    this.isActive = active;
    this.laserBeam.visible = active;
    this.laserDot.visible = active;
    this.laserHalo.visible = active;
  }

  /**
   * Met à jour la position du laser selon la position de l'index
   * @param {Object} indexPos - Position normalisée {x, y} de l'index (0-1)
   * @param {Array} meshes - Liste des meshes à tester pour intersection
   */
  update(indexPos, meshes, deltaTime) {
    if (!this.isActive || !indexPos) {
      this.setActive(false);
      return null;
    }

    // Convertir position 2D écran en coordonnées normalisées (-1 à 1)
    const mouse = new THREE.Vector2(
      (indexPos.x - 0.5) * 2,
      -(indexPos.y - 0.5) * 2
    );

    // Raycasting depuis la caméra
    this.raycaster.setFromCamera(mouse, this.camera);

    // Tester intersections avec les meshes
    const intersects = this.raycaster.intersectObjects(meshes, true);

    let hitPoint = null;

    if (intersects.length > 0) {
      // Point d'intersection trouvé
      hitPoint = intersects[0].point.clone();
      this.targetPoint.copy(hitPoint);

      // Positionner le point laser
      this.laserDot.position.copy(hitPoint);
      this.laserHalo.position.copy(hitPoint);
      
      // Orienter le halo vers la caméra
      this.laserHalo.lookAt(this.camera.position);
    } else {
      // Pas d'intersection, projeter à distance fixe
      const direction = this.raycaster.ray.direction.clone();
      this.targetPoint.copy(this.raycaster.ray.origin).add(direction.multiplyScalar(10));
      this.laserDot.visible = false;
      this.laserHalo.visible = false;
    }

    // Mettre à jour le rayon laser
    const start = this.camera.position.clone();
    const end = this.targetPoint.clone();

    const positions = this.laserBeam.geometry.attributes.position.array;
    positions[0] = start.x;
    positions[1] = start.y;
    positions[2] = start.z;
    positions[3] = end.x;
    positions[4] = end.y;
    positions[5] = end.z;
    this.laserBeam.geometry.attributes.position.needsUpdate = true;

    // Mettre à jour uniforms shader
    if (this.laserBeam.material.uniforms) {
      this.laserBeam.material.uniforms.time.value += deltaTime;
    }

    // Pulsation du halo
    if (this.laserHalo.visible) {
      const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.2;
      this.laserHalo.scale.set(scale, scale, 1);
    }

    return hitPoint;
  }

  /**
   * Change la couleur du laser
   */
  setColor(color) {
    const col = new THREE.Color(color);
    this.laserBeam.material.uniforms.color.value = col;
    this.laserDot.material.color = col;
    this.laserHalo.material.color = col;
  }

  /**
   * Nettoyage
   */
  dispose() {
    if (this.laserBeam) {
      this.laserBeam.geometry.dispose();
      this.laserBeam.material.dispose();
      this.scene.remove(this.laserBeam);
    }
    if (this.laserDot) {
      this.laserDot.geometry.dispose();
      this.laserDot.material.dispose();
      this.scene.remove(this.laserDot);
    }
    if (this.laserHalo) {
      this.laserHalo.geometry.dispose();
      this.laserHalo.material.dispose();
      this.scene.remove(this.laserHalo);
    }
  }
}

/**
 * Gestionnaire mode Touch-Laser
 * Active le laser quand l'index est levé seul
 */
export class TouchLaserManager {
  constructor(scene, camera) {
    this.laser = new LaserPointer(scene, camera);
    this.isEnabled = false;
    this.indexPosition = null;
    this.currentHitPoint = null;
  }

  /**
   * Détecte si le geste correspond au mode laser
   * (index levé, autres doigts baissés)
   */
  detectLaserGesture(landmarks) {
    if (!landmarks || landmarks.length === 0) return false;

    const lm = landmarks[0];
    
    // Index levé (landmark 8 > 6)
    const indexUp = lm[8].y < lm[6].y;
    
    // Majeur baissé (landmark 12 > 10)
    const middleDown = lm[12].y > lm[10].y;
    
    // Annulaire baissé (landmark 16 > 14)
    const ringDown = lm[16].y > lm[14].y;
    
    // Auriculaire baissé (landmark 20 > 18)
    const pinkyDown = lm[20].y > lm[18].y;

    // Pouce pas en pincement avec index
    const thumbDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
    const notPinching = thumbDist > 0.1;

    // Geste laser = index seul levé
    const isLaserGesture = indexUp && middleDown && ringDown && pinkyDown && notPinching;

    if (isLaserGesture) {
      // Stocker position de l'index (tip = landmark 8)
      this.indexPosition = {
        x: lm[8].x,
        y: lm[8].y,
        z: lm[8].z || 0
      };
    }

    return isLaserGesture;
  }

  /**
   * Active le mode laser
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Désactive le mode laser
   */
  disable() {
    this.isEnabled = false;
    this.laser.setActive(false);
  }

  /**
   * Met à jour le laser
   */
  update(landmarks, meshes, deltaTime) {
    if (!this.isEnabled) {
      this.laser.setActive(false);
      return null;
    }

    const isLaserActive = this.detectLaserGesture(landmarks);

    if (isLaserActive && this.indexPosition) {
      this.laser.setActive(true);
      this.currentHitPoint = this.laser.update(this.indexPosition, meshes, deltaTime);
      return this.currentHitPoint;
    } else {
      this.laser.setActive(false);
      return null;
    }
  }

  /**
   * Toggle on/off
   */
  toggle() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.laser.setActive(false);
    }
    return this.isEnabled;
  }

  /**
   * Nettoyage
   */
  dispose() {
    this.laser.dispose();
  }
}
