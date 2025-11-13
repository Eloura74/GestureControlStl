/**
 * HOLO-CONTROL V3 PREMIUM - Frontend Ultra-Immersif
 * React + Three.js + Post-Processing + Advanced Shaders
 * 
 * EFFETS PREMIUM:
 * - Fresnel avancé + scanlines dynamiques
 * - Distorsion vertex (instabilité holographique)
 * - Flottement modèle (lévitation)
 * - Anneaux holographiques rotatifs
 * - Champ d'étoiles
 * - Halo volumétrique
 * - Bloom post-processing
 * - Animations idle automatiques
 * - Scan vertical traversant
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import GesturesHUD from "./components/GesturesHUDV2";
import WebcamPiP from "./components/WebcamPiP";
import ProfileSelector from "./components/ProfileSelector";
import StateBadge from "./components/StateBadge";
import StopButton from "./components/StopButton";

const WS_URL = "ws://127.0.0.1:8765/ws";
const RECONNECT_DELAYS = [500, 1000, 2000, 5000, 5000];

export default function AppV3Premium() {
  const mountRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  
  const [wsStatus, setWsStatus] = useState("connecting");
  const [currentMode, setCurrentMode] = useState("IDLE");
  const [metrics, setMetrics] = useState({ fps: 0, latency: 0 });
  
  const stateRef = useRef({
    rotX: 0, rotY: 0,
    targetRotX: 0, targetRotY: 0,
    distance: 4.0, targetDistance: 4.0,
    explode: 0.0,
    mode: "IDLE",
    freeze: false,
    lastMessage: null,
    idleTime: 0
  });

  useEffect(() => {
    // Scene 3D avec fond noir pur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x01060C, 0.08);

    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, 0, stateRef.current.distance);

    // Renderer optimisé
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mountRef.current.appendChild(renderer.domElement);

    // Post-processing : Bloom
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.15,  // strength (0.4→0.15 : moins agressif)
      0.2,   // radius (0.3→0.2 : plus localisé)
      0.95   // threshold (0.85→0.95 : seulement pixels très lumineux)
    );
    composer.addPass(bloomPass);

    // Lumières
    const hemi = new THREE.HemisphereLight(0x77c0ff, 0x061018, 0.6);
    scene.add(hemi);
    
    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    // Point light holographique (halo - intensité réduite)
    const pointLight = new THREE.PointLight(0x00ffff, 0.3, 10);
    scene.add(pointLight);

    const root = new THREE.Group();
    scene.add(root);

    // EFFET 1: Halo volumétrique (très subtil)
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(3, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.015,  // 0.03→0.015 : encore plus subtil
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    );
    root.add(halo);

    // EFFET 2: Anneaux holographiques (lignes d'ancrage)
    const rings = [];
    for(let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2 + i * 0.5, 2 + i * 0.5 + 0.02, 64),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.10 - i * 0.02,  // 0.15→0.10 : plus discret
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        })
      );
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
      rings.push(ring);
    }

    // EFFET 3: Champ d'étoiles
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for(let i = 0; i < 1000; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.02,
      opacity: 0.25,  // 0.4→0.25 : plus discret
      transparent: true,
      blending: THREE.AdditiveBlending
    }));
    scene.add(stars);

    // Matériau holographique PREMIUM
    const wireframeMaterial = createPremiumHolographicMaterial();
    const materialRef = { current: wireframeMaterial };

    // Loader STL
    const loader = new STLLoader();
    loader.load(
      "/models/Frame_Bolt.stl",
      (geo) => {
        geo.computeVertexNormals();
        geo.center();
        
        const mesh = new THREE.Mesh(geo, wireframeMaterial);
        mesh.scale.set(0.02, 0.02, 0.02);
        root.add(mesh);
        
        // Explosion: store vertices
        const positions = geo.attributes.position.array;
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
          geo.attributes.position.needsUpdate = true;
        };
      },
      undefined,
      (err) => console.error("❌ Erreur chargement STL:", err)
    );

    // WebSocket (identique V3)
    function connectWebSocket() {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ [WS V3 PREMIUM] Connecté");
        setWsStatus("connected");
        reconnectAttempt.current = 0;
        
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: "ping" }));
            } catch (e) {
              console.error("❌ Erreur ping:", e);
            }
          }
        }, 15000);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          
          if (msg.v !== 3 && msg.v !== 2) {
            console.warn("⚠️  Protocol version mismatch:", msg.v);
            return;
          }

          const { g, dbg, preview } = msg;
          const { rot, zoom, explode, freeze, mode } = g;

          const s = stateRef.current;
          s.targetRotY += rot.dx;
          s.targetRotX += rot.dy;
          s.targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.targetRotX));
          s.targetDistance = Math.max(1.2, Math.min(12.0, s.targetDistance - zoom.dz));
          s.explode = Math.max(0, Math.min(1, explode));
          s.mode = mode;
          s.freeze = freeze;
          s.lastMessage = msg;

          // Reset idle timer si geste détecté
          if (mode !== "IDLE") {
            s.idleTime = 0;
          }

          setCurrentMode(mode);

          // Emit HUD event
          const evt = new CustomEvent("holo:hud", {
            detail: {
              rotX: rot.dx,
              rotY: rot.dy,
              zoom: zoom.dz,
              explode: s.explode,
              freeze: freeze,
              mode: mode,
              preview: preview || null
            }
          });
          window.dispatchEvent(evt);
        } catch (e) {
          console.error("❌ Erreur parsing message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ [WS] Erreur:", err);
        setWsStatus("error");
      };

      ws.onclose = () => {
        console.warn("⚠️  [WS] Connexion fermée");
        setWsStatus("disconnected");
        
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        
        const delay = reconnectAttempt.current < RECONNECT_DELAYS.length 
          ? RECONNECT_DELAYS[reconnectAttempt.current]
          : 5000;
          
        console.log(`🔄 Reconnexion dans ${delay}ms...`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempt.current++;
          connectWebSocket();
        }, delay);
      };
    }

    connectWebSocket();

    // Animation loop PREMIUM
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Mise à jour uniforms shader
      if (materialRef.current && materialRef.current.uniforms) {
        materialRef.current.uniforms.time.value = elapsedTime;
        
        // Scan vertical (toutes les 3s en mode IDLE)
        if (stateRef.current.mode === "IDLE") {
          materialRef.current.uniforms.scanPhase.value = (elapsedTime % 3.0) / 3.0;
        } else {
          materialRef.current.uniforms.scanPhase.value = -1.0; // Désactivé
        }
      }

      const s = stateRef.current;
      
      // IDLE Mode: Animation automatique
      if (s.mode === "IDLE") {
        s.idleTime += deltaTime;
        
        // Rotation automatique lente après 2s
        if (s.idleTime > 2.0) {
          s.targetRotY += 0.003;
        }
      }
      
      // Smoothing avec damp
      s.rotX = THREE.MathUtils.damp(s.rotX, s.targetRotX, 5, deltaTime);
      s.rotY = THREE.MathUtils.damp(s.rotY, s.targetRotY, 5, deltaTime);
      s.distance = THREE.MathUtils.damp(s.distance, s.targetDistance, 5, deltaTime);

      root.rotation.x = s.rotX;
      root.rotation.y = s.rotY;
      camera.position.z = s.distance;

      // EFFET 4: Flottement du modèle (lévitation)
      root.position.y = 0.05 * Math.sin(elapsedTime * 1.5);

      // EFFET 5: Rotation des anneaux
      rings.forEach((ring, i) => {
        ring.rotation.z = elapsedTime * (0.2 + i * 0.1);
        // Pulsation opacity (réduite)
        ring.material.opacity = (0.10 - i * 0.02) + 0.02 * Math.sin(elapsedTime * 2 + i);
      });

      // EFFET 6: Rotation lente des étoiles
      stars.rotation.y = elapsedTime * 0.02;

      // EFFET 7: Pulsation halo
      halo.scale.setScalar(1.0 + 0.05 * Math.sin(elapsedTime * 2));

      // Explosion
      root.traverse((obj) => {
        if (obj.isMesh && obj.userData.applyExplosion) {
          obj.userData.applyExplosion(s.explode);
        }
      });

      // Render avec post-processing
      composer.render();
    }
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Hotkeys
    const handleKeyPress = (e) => {
      const s = stateRef.current;
      switch (e.key.toLowerCase()) {
        case "r":
          s.targetRotX = 0;
          s.targetRotY = 0;
          s.targetDistance = 4.0;
          break;
        case "e":
          s.explode = s.explode > 0.5 ? 0 : 1;
          break;
      }
    };
    window.addEventListener("keypress", handleKeyPress);

    // Fetch metrics
    const metricsInterval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:8765/api/metrics");
        const data = await res.json();
        setMetrics({
          fps: data.fps || 0,
          latency: data.latency_ms?.total || 0
        });
      } catch (e) {
        // Silently fail
      }
    }, 2000);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keypress", handleKeyPress);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (metricsInterval) clearInterval(metricsInterval);
      if (wsRef.current) wsRef.current.close();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} />
      <StopButton />
      <GesturesHUD />
      <WebcamPiP />
      <ProfileSelector />
      <StateBadge mode={currentMode} />
      
      {/* Metrics Display V3 PREMIUM */}
      <div style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px) saturate(180%)",
        color: "#0ff",
        padding: "8px 12px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "11px",
        border: "1px solid rgba(0,255,200,0.5)",
        boxShadow: "0 0 20px rgba(0,255,200,0.2)",
        display: "flex",
        gap: "12px"
      }}>
        <div>🎯 FPS: {metrics.fps.toFixed(1)}</div>
        <div>⚡ {metrics.latency.toFixed(1)}ms</div>
        <div style={{ 
          color: wsStatus === "connected" ? "#0f0" : 
                 wsStatus === "connecting" ? "#ff0" : "#f00",
          textShadow: "0 0 10px currentColor"
        }}>
          ● V3 PREMIUM
        </div>
      </div>
    </>
  );
}

// ============================================================
// SHADER HOLOGRAPHIQUE PREMIUM
// ============================================================

function createPremiumHolographicMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      scanPhase: { value: -1.0 }
    },
    vertexShader: `
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        // EFFET: Distorsion vertex (instabilité holographique)
        vec3 p = position;
        p.x += 0.008 * sin(p.y * 40.0 + time * 5.0);
        p.z += 0.008 * cos(p.y * 40.0 + time * 5.0);
        
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
      
      void main() {
        // Couleurs holographiques
        vec3 baseColor = vec3(0.2, 0.9, 1.0);
        vec3 edgeColor = vec3(0.6, 1.0, 1.0);
        
        // EFFET: Fresnel amélioré
        float viewDot = dot(normalize(vNormal), normalize(vViewDir));
        float fresnel = pow(1.0 - abs(viewDot), 3.0);
        fresnel = clamp(fresnel * 0.7, 0.0, 0.7);
        
        // EFFET: Scanlines dynamiques
        float scanline = 0.05 * sin(50.0 * vPosition.y + time * 8.0);
        scanline = clamp(scanline, 0.0, 0.1);
        
        // Wireframe procedural
        vec3 grid = fract(vPosition * 25.0);
        float gridLine = min(min(grid.x, grid.y), grid.z);
        float wireframe = 1.0 - smoothstep(0.0, 0.05, gridLine);
        
        // Pulsation
        float pulse = sin(time * 1.5) * 0.08 + 0.92;
        
        // EFFET: Scan vertical traversant (mode IDLE)
        float scanBand = 0.0;
        if (scanPhase >= 0.0) {
          float scanPos = scanPhase * 4.0 - 2.0;
          float dist = abs(vPosition.y - scanPos);
          scanBand = smoothstep(0.3, 0.0, dist) * 0.5;
        }
        
        // Composition (intensité réduite)
        vec3 finalColor = mix(baseColor, edgeColor, fresnel * 0.7);
        finalColor += vec3(wireframe * 0.5);  // 0.7→0.5
        finalColor += vec3(scanline * 0.7);   // Réduit
        finalColor += vec3(scanBand * 0.6);   // Réduit
        finalColor *= pulse;
        
        // Empêcher faces plates blanches
        float flatness = abs(viewDot);
        finalColor = mix(finalColor, baseColor, flatness * 0.3);
        
        // Alpha (réduit pour moins de surexposition)
        float alpha = 0.30 + fresnel * 0.25 + wireframe * 0.35;
        alpha = clamp(alpha, 0.25, 0.65);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
