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
import HoloControlBar from "./components/HoloControlBar";
import { autoFitMesh, createEnhancedHolographicShader } from "./three/utils";
import { DirectionalParticleSystem, VolumetricGradient } from "./three/ParticleSystem";
import { PulseWaves, HandHalo, FreezeEffect, SpectacleMode } from "./three/VisualEffects";
import { GestureRecorder, RecorderUIController } from "./three/GestureRecorder";
import { MultiSTLManager, STLGalleryController } from "./three/MultiSTLManager";
import RecorderPanel from "./components/RecorderPanel";
import ModelGallery from "./components/ModelGallery";
import MeasureDisplay from "./components/MeasureDisplay";
import PerformanceMonitor from "./components/PerformanceMonitor";

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
    distance: 3.0, targetDistance: 3.0,  
    explode: 0.0,
    mode: "IDLE",
    freeze: false,
    lastMessage: null,
    idleTime: 0
  });

  useEffect(() => {
    // Nettoyer tout canvas orphelin au démarrage
    const existingCanvases = mountRef.current?.querySelectorAll('canvas');
    existingCanvases?.forEach(canvas => canvas.remove());
    
    // Scene 3D avec fond noir pur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x01060C, 0.08);

    const camera = new THREE.PerspectiveCamera(
      50,  // 35→50 : FOV plus large pour mieux voir le modèle
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, 0, 3);  // Distance initiale réduite

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
    
    // EFFET 3b: Particules flottantes holographiques (nouvelle ambiance)
    const floatingParticlesGeometry = new THREE.BufferGeometry();
    const floatingPositions = [];
    for(let i = 0; i < 300; i++) {
      floatingPositions.push(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10 - 5,  // Commence en bas
        (Math.random() - 0.5) * 15
      );
    }
    floatingParticlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floatingPositions, 3));
    const floatingParticles = new THREE.Points(floatingParticlesGeometry, new THREE.PointsMaterial({
      color: 0x00ddff,
      size: 0.05,
      opacity: 0.6,
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: createParticleTexture()
    }));
    scene.add(floatingParticles);
    
    // Fonction pour créer une texture de particule (rond flou)
    function createParticleTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }

    // EFFET 4: Particules directionnelles réactives
    const particleSystem = new DirectionalParticleSystem(scene, 500);
    
    // EFFET 5: Gradient volumétrique dynamique (brume holographique)
    // Brume volumétrique TRÈS subtile (opacité réduite)
    const volumetricFog = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 32),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec3 vPosition;
          
          void main() {
            float dist = length(vPosition);
            float alpha = smoothstep(20.0, 10.0, dist) * 0.03;  // 0.15 → 0.03 (5x plus subtil)
            
            // Gradient bleu foncé → cyan
            vec3 color = mix(vec3(0.0, 0.05, 0.1), vec3(0.0, 0.4, 0.5), dist / 20.0);
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        uniforms: {
          time: { value: 0 }
        },
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false
      })
    );
    scene.add(volumetricFog);

    // Tableau pour stocker les meshes (pour interactions futures)
    const allMeshes = [];

    // Matériau holographique PREMIUM (avec effets avancés)
    const wireframeMaterial = createEnhancedHolographicShader();
    const materialRef = { current: wireframeMaterial };

    // EFFET 8: Gesture Recorder
    const gestureRecorder = new GestureRecorder();
    const recorderUI = new RecorderUIController(gestureRecorder);
    const cleanupHotkeys = recorderUI.setupHotkeys();

    // EFFET 9: Multi-STL Manager
    const autoFitFunc = (mesh) => {
      const fitData = autoFitMesh(mesh, camera);
      if (fitData) {
        stateRef.current.distance = fitData.optimalDistance;
        stateRef.current.targetDistance = fitData.optimalDistance;
      }
    };
    
    const multiSTL = new MultiSTLManager(scene, root, wireframeMaterial, camera, autoFitFunc);
    const galleryController = new STLGalleryController(multiSTL);
    
    // Ajouter des modèles STL à la galerie
    multiSTL.addModel("/models/Frame_Bolt.stl", "Frame Bolt");
    multiSTL.addModel("/models/roller_bearing.stl", "Roller Bearing");
    multiSTL.addModel("/models/bearing.obj", "Bearing");

    // Charger tous les modèles au démarrage
    (async () => {
      try {
        console.log("📥 Chargement de tous les modèles...");
        
        // Charger tous les modèles en parallèle
        await Promise.all([
          multiSTL.loadModel(0),
          multiSTL.loadModel(1),
          multiSTL.loadModel(2)  // ← Ajouter
        ]);
        
        console.log("✅ Tous les modèles chargés");
        
        // Afficher le premier
        await multiSTL.switchToModel(0);
        
        // Ajouter mesh(es) au tableau pour laser
        const meshes = multiSTL.getCurrentMeshes();
        if (meshes && meshes.length > 0) {
          allMeshes.push(...meshes);
          
          // Auto-fit initial
          const meshToFit = multiSTL.getCurrentMesh();
          const fitData = autoFitMesh(meshToFit, camera);
          if (fitData) {
            stateRef.current.distance = fitData.optimalDistance;
            stateRef.current.targetDistance = fitData.optimalDistance;
            camera.position.z = fitData.optimalDistance;
            console.log("✅ Auto-fit initial appliqué");
          }
        }
      } catch (err) {
        console.error("❌ Erreur chargement modèles:", err);
      }
    })();

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
        
        // Emit event pour HoloControlBar
        window.dispatchEvent(new CustomEvent("holo:ws:status", {
          detail: { status: "connected" }
        }));
        
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
          
          // Ignorer messages pong
          if (msg.type === 'pong') return;
          
          // Vérifier version protocole
          if (msg.v !== 3 && msg.v !== 2) {
            console.warn("⚠️  Protocol version mismatch:", msg.v);
            return;
          }

          const { g, dbg, preview } = msg;
          if (!g) return; // Pas de données gestes
          
          const { rot, zoom, explode, freeze, mode } = g;

          const s = stateRef.current;
          s.targetRotY += rot.dx;
          s.targetRotX += rot.dy;
          s.targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.targetRotX));
          // Permettre de zoomer TRES près (0.3) pour examiner les détails
          // Gain zoom augmenté x9 pour plus de sensibilité
          s.targetDistance = Math.max(0.3, Math.min(12.0, s.targetDistance - (zoom.dz * 9.0)));
          s.explode = Math.max(0, Math.min(1, explode));
          s.mode = mode;
          s.lastMessage = msg;
          
          // Émettre event pour PerformanceMonitor
          window.dispatchEvent(new CustomEvent('ws:message', { detail: msg }));
          
          // Freeze si mode freeze OU playback (plus de freeze automatique pour mesure)
          const isLocked = freeze || s.playbackActive;
          s.freeze = isLocked;
          
          // HOLO-LOCK : Si mode FREEZE, changer la couleur du shader
          if (isLocked && wireframeMaterial.uniforms) {
            // Shader devient vert quand locked
            if (!wireframeMaterial.userData.originalColor) {
              wireframeMaterial.userData.originalColor = true;
            }
          } else if (wireframeMaterial.userData.originalColor) {
            wireframeMaterial.userData.originalColor = false;
          }

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
        
        window.dispatchEvent(new CustomEvent("holo:ws:status", {
          detail: { status: "error" }
        }));
      };

      ws.onclose = () => {
        console.warn("⚠️  [WS] Connexion fermée");
        setWsStatus("disconnected");
        
        window.dispatchEvent(new CustomEvent("holo:ws:status", {
          detail: { status: "disconnected" }
        }));
        
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

    // Système de mesure avec marqueurs fixes
    let measureMarkers = {
      point1: null,
      point2: null,
      line: null,
      sphere1: null,
      sphere2: null,
      lastGestureState: { left: false, right: false }
    };
    
    const createMeasureSystem = () => {
      // Ligne de mesure
      const lineGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array([0, 0, 0, 1, 0, 0]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff00, 
        linewidth: 5,
        transparent: true,
        opacity: 0.9
      });
      measureMarkers.line = new THREE.Line(lineGeometry, lineMaterial);
      measureMarkers.line.visible = false;
      scene.add(measureMarkers.line);
      
      // Marqueur 1 (rouge)
      const sphere1Geometry = new THREE.SphereGeometry(0.08, 16, 16);
      const sphere1Material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.9,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
      });
      measureMarkers.sphere1 = new THREE.Mesh(sphere1Geometry, sphere1Material);
      measureMarkers.sphere1.visible = false;
      scene.add(measureMarkers.sphere1);
      
      // Marqueur 2 (bleu)
      const sphere2Geometry = new THREE.SphereGeometry(0.08, 16, 16);
      const sphere2Material = new THREE.MeshStandardMaterial({ 
        color: 0x0000ff,
        transparent: true,
        opacity: 0.9,
        emissive: 0x0000ff,
        emissiveIntensity: 0.5
      });
      measureMarkers.sphere2 = new THREE.Mesh(sphere2Geometry, sphere2Material);
      measureMarkers.sphere2.visible = false;
      scene.add(measureMarkers.sphere2);
    };
    createMeasureSystem();
    
    // ===== EFFETS VISUELS V3.0 =====
    const pulseWaves = new PulseWaves(scene);
    const handHalo = new HandHalo(scene, camera);
    const freezeEffect = new FreezeEffect(scene);
    const spectacleMode = new SpectacleMode();
    let lastMode = 'IDLE';
    
    // Fonction pour placer un marqueur avec raycasting
    const placeMarkerAtHand = (handPos, markerNumber) => {
      // Convertir position main (0-1) en coordonn\u00e9es NDC (-1 \u00e0 1)
      const x = handPos.x * 2 - 1;
      const y = -(handPos.y * 2 - 1);
      
      // Raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      // Intersection avec tous les meshes
      const allMeshes = [];
      root.traverse((obj) => {
        if (obj.isMesh) allMeshes.push(obj);
      });
      
      const intersects = raycaster.intersectObjects(allMeshes);
      
      if (intersects.length > 0) {
        const point = intersects[0].point;
        if (markerNumber === 1) {
          measureMarkers.point1 = point.clone();
          measureMarkers.sphere1.position.copy(point);
          measureMarkers.sphere1.visible = true;
          console.log('🔴 Marqueur 1 placé:', point);
          window.dispatchEvent(new CustomEvent('measure:markers', { 
            detail: { point1: true, point2: !!measureMarkers.point2 } 
          }));
        } else {
          measureMarkers.point2 = point.clone();
          measureMarkers.sphere2.position.copy(point);
          measureMarkers.sphere2.visible = true;
          console.log('🔵 Marqueur 2 placé:', point);
          window.dispatchEvent(new CustomEvent('measure:markers', { 
            detail: { point1: !!measureMarkers.point1, point2: true } 
          }));
        }
        return true;
      }
      return false;
    };
    
    // Fonction pour réinitialiser les marqueurs
    const resetMarkers = () => {
      measureMarkers.point1 = null;
      measureMarkers.point2 = null;
      measureMarkers.sphere1.visible = false;
      measureMarkers.sphere2.visible = false;
      measureMarkers.line.visible = false;
      measureMarkers.lastGestureState = { left: false, right: false };
      window.dispatchEvent(new CustomEvent('measure:update', { detail: { active: false } }));
      window.dispatchEvent(new CustomEvent('measure:markers', { detail: { point1: false, point2: false } }));
      console.log('🗑️ Marqueurs réinitialisés');
    };
    
    // Touche ECHAP pour reset les marqueurs
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        resetMarkers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Slice view supprimé (non souhaité)

    // Listeners pour Recorder
    const handleToggleRecording = () => {
      recorderUI.toggleRecording();
    };
    const handleTogglePlayback = () => {
      recorderUI.togglePlayback();
    };
    const handlePause = () => {
      gestureRecorder.togglePause();
    };
    const handleStop = () => {
      if (gestureRecorder.isRecording) {
        gestureRecorder.stopRecording();
      } else if (gestureRecorder.isPlaying) {
        gestureRecorder.stopPlayback();
      }
    };
    const handlePlay = (e) => {
      gestureRecorder.startPlayback(e.detail.id);
    };
    const handleDelete = (e) => {
      gestureRecorder.deleteRecording(e.detail.id);
    };
    const handleExport = (e) => {
      gestureRecorder.exportToJSON(e.detail.id);
    };
    const handleImport = (e) => {
      gestureRecorder.importFromJSON(e.detail.json);
    };
    const handleGetRecordings = () => {
      const recordings = gestureRecorder.getRecordings();
      window.dispatchEvent(new CustomEvent("recorder:recordings-list", {
        detail: { recordings }
      }));
    };
    const handleGetState = () => {
      const state = gestureRecorder.getState();
      window.dispatchEvent(new CustomEvent("recorder:state-update", {
        detail: state
      }));
    };
    const handleGetProgress = () => {
      const state = gestureRecorder.getState();
      window.dispatchEvent(new CustomEvent("recorder:state-update", {
        detail: state
      }));
    };

    window.addEventListener("recorder:toggle-recording", handleToggleRecording);
    window.addEventListener("recorder:toggle-playback", handleTogglePlayback);
    window.addEventListener("recorder:pause", handlePause);
    window.addEventListener("recorder:stop", handleStop);
    window.addEventListener("recorder:play", handlePlay);
    window.addEventListener("recorder:delete", handleDelete);
    window.addEventListener("recorder:export", handleExport);
    window.addEventListener("recorder:import", handleImport);
    window.addEventListener("recorder:get-recordings", handleGetRecordings);
    window.addEventListener("recorder:get-state", handleGetState);
    window.addEventListener("recorder:get-progress", handleGetProgress);

    // Listeners pour MultiSTL
    const handleMultiSTLSwitch = (e) => {
      multiSTL.switchToModel(e.detail.index).then(() => {
        // Mettre à jour allMeshes pour laser
        const meshes = multiSTL.getCurrentMeshes();
        if (meshes && meshes.length > 0) {
          allMeshes.length = 0;
          allMeshes.push(...meshes);
        }
      });
    };
    const handleMultiSTLNext = () => {
      multiSTL.nextModel().then(() => {
        const meshes = multiSTL.getCurrentMeshes();
        if (meshes && meshes.length > 0) {
          allMeshes.length = 0;
          allMeshes.push(...meshes);
        }
      });
    };
    const handleMultiSTLPrevious = () => {
      multiSTL.previousModel().then(() => {
        const meshes = multiSTL.getCurrentMeshes();
        if (meshes && meshes.length > 0) {
          allMeshes.length = 0;
          allMeshes.push(...meshes);
        }
      });
    };
    const handleMultiSTLGetList = () => {
      const models = multiSTL.getModelsList();
      window.dispatchEvent(new CustomEvent("multiSTL:models-list", {
        detail: { models }
      }));
    };

    window.addEventListener("multiSTL:switch", handleMultiSTLSwitch);
    window.addEventListener("multiSTL:next", handleMultiSTLNext);
    window.addEventListener("multiSTL:previous", handleMultiSTLPrevious);
    window.addEventListener("multiSTL:get-list", handleMultiSTLGetList);

    // Position souris pour contrôle laser (temporaire)
    const mousePos = { x: 0.5, y: 0.5 };
    const handleMouseMove = (e) => {
      mousePos.x = e.clientX / window.innerWidth;
      mousePos.y = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", handleMouseMove);

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
        
        // Glitch aléatoire occasionnel
        if (Math.random() > 0.98) {
          materialRef.current.uniforms.glitchAmount.value = 1.0;
          setTimeout(() => {
            if (materialRef.current?.uniforms) {
              materialRef.current.uniforms.glitchAmount.value = 0.0;
            }
          }, 100);
        }
      }

      const s = stateRef.current;
      
      // Ne pas freezer pendant la mesure (on peut bouger pour placer les marqueurs)
      const isLocked = s.freeze;
      
      // ===== UPDATE EFFETS VISUELS V3.0 =====
      pulseWaves.update(deltaTime);
      
      // Détection changement de mode → onde pulsée
      if (s.mode && s.mode !== lastMode) {
        if (s.mode === 'ZOOM' || s.mode === 'EXPLODE' || s.mode === 'FREEZE') {
          pulseWaves.createWave(s.mode, 1.0);
        }
        lastMode = s.mode;
      }
      
      // Hand Halo (position main)
      if (s.lastMessage && s.lastMessage.dbg && s.lastMessage.dbg.hands > 0) {
        // Position fictive (centre écran pour l'instant)
        handHalo.update({x: 0.5, y: 0.5}, elapsedTime);
      } else {
        handHalo.update(null, elapsedTime);
      }
      
      // Effet freeze
      freezeEffect.setActive(isLocked, elapsedTime);
      
      // IDLE Mode: Animation automatique + Mode spectacle
      if (s.mode === 'IDLE' && !isLocked) {
        s.idleTime += deltaTime;
        
        // Rotation automatique lente après 2s
        if (s.idleTime > 2.0 && s.idleTime <= 5.0) {
          s.targetRotY += 0.003;
        }
        
        // Mode spectacle après 5s
        if (s.idleTime > 5.0) {
          if (!spectacleMode.isActive) {
            spectacleMode.activate();
          }
          
          const spectacle = spectacleMode.update(deltaTime);
          if (spectacle) {
            s.targetRotY += spectacle.rotationSpeed;
            
            // Color shift shader
            if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.color) {
              materialRef.current.uniforms.color.value.setRGB(
                spectacle.colorShift.r,
                spectacle.colorShift.g,
                spectacle.colorShift.b
              );
            }
          }
        }
      } else {
        // Reset idle
        s.idleTime = 0;
        
        // Désactiver spectacle si actif
        if (spectacleMode.isActive) {
          spectacleMode.deactivate();
          // Reset couleur
          if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.color) {
            materialRef.current.uniforms.color.value.setRGB(0, 1, 1);
          }
        }
      }
      
      // Smoothing avec damp (seulement si pas locked)
      if (!isLocked) {
        s.rotX = THREE.MathUtils.damp(s.rotX, s.targetRotX, 5, deltaTime);
        s.rotY = THREE.MathUtils.damp(s.rotY, s.targetRotY, 5, deltaTime);
        s.distance = THREE.MathUtils.damp(s.distance, s.targetDistance, 5, deltaTime);

        root.rotation.x = s.rotX;
        root.rotation.y = s.rotY;
        camera.position.z = s.distance;
      }

      // EFFET 4: Flottement du modèle (lévitation) - Désactivé si locked
      if (!isLocked) {
        root.position.y = 0.015 * Math.sin(elapsedTime * 1.0);
      }

      // EFFET 5: Rotation des anneaux
      rings.forEach((ring, i) => {
        ring.rotation.z = elapsedTime * (0.2 + i * 0.1);
        // Pulsation opacity (réduite)
        ring.material.opacity = (0.10 - i * 0.02) + 0.02 * Math.sin(elapsedTime * 2 + i);
      });

      // EFFET 6: Rotation lente des étoiles
      stars.rotation.y = elapsedTime * 0.02;
      
      // EFFET 7: Animer les particules flottantes (si créées)
      if (floatingParticles) {
        floatingParticles.rotation.y = elapsedTime * 0.05;
        // Animation verticale des particules
        const positions = floatingParticles.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i);
          positions.setY(i, y + 0.002);
          // Reset si trop haut
          if (y > 5) {
            positions.setY(i, -5);
          }
        }
        positions.needsUpdate = true;
      }

      // EFFET 7: Pulsation halo
      halo.scale.setScalar(1.0 + 0.05 * Math.sin(elapsedTime * 2));

      // EFFET 8: Mise à jour particules directionnelles
      particleSystem.update(deltaTime, s.mode, {
        rotX: s.rotX,
        rotY: s.rotY,
        zoom: s.targetDistance - s.distance,
        explode: s.explode
      });

      // EFFET 9: Gradient volumétrique (déjà mis à jour plus bas avec volumetricFog)
      // Touch-Laser et Slice View supprimés (non souhaités)

      // EFFET 12: Gesture Recorder
      if (gestureRecorder.isRecording) {
        // Enregistrer la frame actuelle
        gestureRecorder.recordFrame({
          rotX: s.rotX,
          rotY: s.rotY,
          zoom: s.targetDistance - s.distance,
          explode: s.explode,
          mode: s.mode,
          freeze: s.freeze
        });
      } else if (gestureRecorder.isPlaying) {
        // Rejouer les gestes enregistrés
        const playbackFrame = gestureRecorder.getPlaybackFrame();
        if (playbackFrame) {
          s.targetRotX += playbackFrame.rotY;
          s.targetRotY += playbackFrame.rotX;
          s.targetDistance = Math.max(0.3, Math.min(12.0, s.targetDistance - playbackFrame.zoom));
          s.explode = playbackFrame.explode;
        }
      }

      // Explosion : Utiliser le MultiSTL Manager (supporte STL et OBJ)
      multiSTL.applyExplosion(s.explode);
      
      // Système de mesure temporairement désactivé (en debug)
      // TODO: Réactiver une fois que rotation/explode fonctionnent
      /*
      if (s.lastMessage && s.lastMessage.measure) {
        const measure = s.lastMessage.measure;
        
        // Détection des mains avec geste 🤘
        const hasLeftGesture = measure.has_left_gesture || false;
        const hasRightGesture = measure.has_right_gesture || false;
        
        // Placer marqueur 1 si main gauche fait le geste (front montant)
        if (hasLeftGesture && !measureMarkers.lastGestureState.left) {
          if (measure.pos1) {
            placeMarkerAtHand(measure.pos1, 1);
          }
        }
        measureMarkers.lastGestureState.left = hasLeftGesture;
        
        // Placer marqueur 2 si main droite fait le geste (front montant)
        if (hasRightGesture && !measureMarkers.lastGestureState.right) {
          if (measure.pos2) {
            placeMarkerAtHand(measure.pos2, 2);
          }
        }
        measureMarkers.lastGestureState.right = hasRightGesture;
      }
      */
      
      // Afficher ligne et distance si 2 marqueurs placés
      if (measureMarkers.point1 && measureMarkers.point2) {
        // Ligne entre les 2 marqueurs
        measureMarkers.line.visible = true;
        const positions = measureMarkers.line.geometry.attributes.position;
        positions.setXYZ(0, measureMarkers.point1.x, measureMarkers.point1.y, measureMarkers.point1.z);
        positions.setXYZ(1, measureMarkers.point2.x, measureMarkers.point2.y, measureMarkers.point2.z);
        positions.needsUpdate = true;
        
        // Animation pulsation des sphères
        const pulse = Math.sin(elapsedTime * 3) * 0.1 + 1;
        measureMarkers.sphere1.scale.setScalar(pulse);
        measureMarkers.sphere2.scale.setScalar(pulse);
        
        // Calculer distance
        const distance = measureMarkers.point1.distanceTo(measureMarkers.point2);
        
        // Émettre événement pour affichage
        window.dispatchEvent(new CustomEvent('measure:update', { 
          detail: { 
            active: true, 
            distance: distance 
          } 
        }));
      } else {
        measureMarkers.line.visible = false;
        window.dispatchEvent(new CustomEvent('measure:update', { detail: { active: false } }));
      }
      
      // Mettre à jour le fog volumétrique
      if (volumetricFog) {
        volumetricFog.material.uniforms.time.value = elapsedTime;
      }

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
      window.removeEventListener("holo:laser:toggle", handleLaserToggle);
      window.removeEventListener("holo:slice:toggle", handleSliceToggle);
      window.removeEventListener("holo:slice:axis", handleSliceAxis);
      window.removeEventListener("mousemove", handleMouseMove);
      
      window.removeEventListener("recorder:toggle-recording", handleToggleRecording);
      window.removeEventListener("recorder:toggle-playback", handleTogglePlayback);
      window.removeEventListener("recorder:pause", handlePause);
      window.removeEventListener("recorder:stop", handleStop);
      window.removeEventListener("recorder:play", handlePlay);
      window.removeEventListener("recorder:delete", handleDelete);
      window.removeEventListener("recorder:export", handleExport);
      window.removeEventListener("recorder:import", handleImport);
      window.removeEventListener("recorder:get-recordings", handleGetRecordings);
      window.removeEventListener("recorder:get-state", handleGetState);
      window.removeEventListener("recorder:get-progress", handleGetProgress);
      
      window.removeEventListener("multiSTL:switch", handleMultiSTLSwitch);
      window.removeEventListener("multiSTL:next", handleMultiSTLNext);
      window.removeEventListener("multiSTL:previous", handleMultiSTLPrevious);
      window.removeEventListener("multiSTL:get-list", handleMultiSTLGetList);
      
      cleanupHotkeys();
      galleryController.dispose();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (metricsInterval) clearInterval(metricsInterval);
      if (wsRef.current) wsRef.current.close();
      particleSystem.dispose();
      pulseWaves.dispose();
      handHalo.dispose();
      freezeEffect.dispose();
      if (measureMarkers.line) scene.remove(measureMarkers.line);
      if (measureMarkers.sphere1) scene.remove(measureMarkers.sphere1);
      if (measureMarkers.sphere2) scene.remove(measureMarkers.sphere2);
      window.removeEventListener('keydown', handleKeyDown);
      gestureRecorder.dispose();
      multiSTL.dispose();
      
      // Nettoyer le renderer et le canvas
      if (mountRef.current && renderer.domElement) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (e) {
          console.warn("Canvas déjà supprimé");
        }
      }
      renderer.dispose();
      
      // Nettoyer tous les canvas orphelins
      const remainingCanvases = document.querySelectorAll('canvas');
      remainingCanvases.forEach(canvas => {
        if (canvas.parentElement === mountRef.current) {
          canvas.remove();
        }
      });
    };
  }, []);

  return (
    <>
      <div ref={mountRef} />
      
      {/* Interface unifiée - Vue dégagée */}
      <HoloControlBar />
      
      {/* HUD Détaillé (optionnel, peut être caché par défaut) */}
      {/* <GesturesHUD /> - Désactivé pour interface épurée */}
      <WebcamPiP />
      
      {/* Panels avancés */}
      <RecorderPanel />
      <ModelGallery />
      
      {/* Affichage mesure de distance */}
      <MeasureDisplay />
      
      {/* Moniteur performance V3.0 */}
      <PerformanceMonitor />
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
