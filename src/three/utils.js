/**
 * THREE.JS UTILITIES
 * Fonctions utilitaires pour la scène 3D
 */

import * as THREE from "three";

/**
 * Auto-fit un mesh dans la caméra avec zoom optimal
 * Calcule la bounding sphere et ajuste la distance de la caméra
 */
export function autoFitMesh(mesh, camera, targetDistance = null) {
  if (!mesh || !camera) return;

  // Calculer la bounding box
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Rayon de la bounding sphere
  const maxDim = Math.max(size.x, size.y, size.z);
  const boundingSphereRadius = maxDim / 2;

  // Calcul distance optimale basé sur FOV
  const fov = camera.fov * (Math.PI / 180);
  const distance = Math.abs(boundingSphereRadius / Math.sin(fov / 2));

  // Ajouter marge de sécurité (1.2x au lieu de 1.5x pour être plus proche)
  const optimalDistance = distance * 1.2;

  // Logger pour debug
  console.log(`📐 Auto-Fit: Size=${maxDim.toFixed(2)}, Distance=${optimalDistance.toFixed(2)}`);

  return {
    center,
    size,
    boundingSphereRadius,
    optimalDistance: targetDistance || optimalDistance
  };
}

/**
 * Centre un mesh à l'origine
 */
export function centerMesh(mesh) {
  if (!mesh) return;
  
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  
  mesh.position.sub(center);
}

/**
 * Calcule l'échelle optimale pour un mesh selon une taille cible
 */
export function getOptimalScale(mesh, targetSize = 2.0) {
  if (!mesh) return 1.0;

  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  return targetSize / maxDim;
}

/**
 * Crée un shader holographique amélioré avec effets premium
 * - Fresnel avancé
 * - Scanlines dynamiques
 * - Diffractions arc-en-ciel
 * - Arcs électriques
 * - Noise spatial
 */
export function createEnhancedHolographicShader() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scanPhase: { value: -1.0 },
      glitchAmount: { value: 0.0 }
    },
    vertexShader: `
      uniform float time;
      uniform float glitchAmount;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      // Simplex Noise 3D (Ian McEwan, Ashima Arts)
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vec3 p = position;
        
        // EFFET 1: Distorsion vertex holographique (instabilité)
        float noiseFreq = 40.0;
        float noiseAmp = 0.008;
        p.x += noiseAmp * sin(p.y * noiseFreq + time * 5.0);
        p.z += noiseAmp * cos(p.y * noiseFreq + time * 5.0);
        
        // EFFET 2: Noise spatial 3D
        float noise3d = snoise(p * 2.0 + time * 0.5) * 0.01;
        p += normal * noise3d;
        
        // EFFET 3: Glitch occasionnel
        if (glitchAmount > 0.5) {
          p.x += sin(time * 50.0) * 0.02;
          p.y += cos(time * 30.0) * 0.02;
        }
        
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vPosition = p;
        vWorldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform float scanPhase;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      // Fonction pour créer un arc-en-ciel (diffraction)
      vec3 rainbow(float t) {
        t = fract(t);
        float r = abs(t * 6.0 - 3.0) - 1.0;
        float g = 2.0 - abs(t * 6.0 - 2.0);
        float b = 2.0 - abs(t * 6.0 - 4.0);
        return clamp(vec3(r, g, b), 0.0, 1.0);
      }
      
      void main() {
        // Couleurs holographiques de base
        vec3 baseColor = vec3(0.2, 0.9, 1.0);
        vec3 edgeColor = vec3(0.6, 1.0, 1.0);
        
        // EFFET 1: Fresnel amélioré
        float viewDot = dot(normalize(vNormal), normalize(vViewDir));
        float fresnel = pow(1.0 - abs(viewDot), 3.0);
        fresnel = clamp(fresnel * 0.7, 0.0, 0.7);
        
        // EFFET 2: Diffraction arc-en-ciel subtile
        float diffractionAmount = fresnel * 0.15;
        vec3 diffractionColor = rainbow(vPosition.y * 0.5 + time * 0.1);
        
        // EFFET 3: Scanlines dynamiques
        float scanline = 0.05 * sin(50.0 * vPosition.y + time * 8.0);
        scanline = clamp(scanline, 0.0, 0.1);
        
        // EFFET 4: Wireframe procedural (Tron-style edges)
        vec3 grid = fract(vPosition * 25.0);
        float gridLine = min(min(grid.x, grid.y), grid.z);
        float wireframe = 1.0 - smoothstep(0.0, 0.05, gridLine);
        
        // EFFET 5: Edge highlights (arêtes brillantes)
        float edgeHighlight = pow(1.0 - abs(viewDot), 8.0) * 0.6;
        
        // EFFET 6: Arcs électriques (lignes fines aléatoires)
        float electricArc = 0.0;
        for(int i = 0; i < 3; i++) {
          float arcNoise = sin(vPosition.y * 100.0 + float(i) * 100.0 + time * 10.0);
          electricArc += smoothstep(0.98, 1.0, arcNoise) * 0.2;
        }
        
        // Pulsation générale
        float pulse = sin(time * 1.5) * 0.08 + 0.92;
        
        // EFFET 7: Scan vertical traversant (mode IDLE)
        float scanBand = 0.0;
        if (scanPhase >= 0.0) {
          float scanPos = scanPhase * 4.0 - 2.0;
          float dist = abs(vPosition.y - scanPos);
          scanBand = smoothstep(0.3, 0.0, dist) * 0.5;
        }
        
        // COMPOSITION FINALE
        vec3 finalColor = mix(baseColor, edgeColor, fresnel * 0.7);
        finalColor = mix(finalColor, diffractionColor, diffractionAmount);
        finalColor += vec3(wireframe * 0.5);
        finalColor += vec3(edgeHighlight);
        finalColor += vec3(scanline * 0.7);
        finalColor += vec3(scanBand * 0.6);
        finalColor += vec3(electricArc);
        finalColor *= pulse;
        
        // Empêcher faces plates trop blanches
        float flatness = abs(viewDot);
        finalColor = mix(finalColor, baseColor, flatness * 0.3);
        
        // Alpha avec variations
        float alpha = 0.30 + fresnel * 0.25 + wireframe * 0.35 + electricArc * 0.2;
        alpha = clamp(alpha, 0.25, 0.70);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
