/**
 * HOLO-CONTROL V3.0 - Frontend Ultra-Optimisé
 * React + Three.js + Anti-Jitter Damp + Metrics + Protocol V3
 * OPTIMISATIONS:
 * - THREE.MathUtils.damp (smoothing naturel)
 * - Metrics display temps réel
 * - Protocol V3 support
 * - Performance monitoring
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";
import GesturesHUD from "./components/GesturesHUDV2";
import WebcamPiP from "./components/WebcamPiP";
import ProfileSelector from "./components/ProfileSelector";
import StateBadge from "./components/StateBadge";
import StopButton from "./components/StopButton";

const WS_URL = "ws://127.0.0.1:8765/ws";
const RECONNECT_DELAYS = [500, 1000, 2000, 5000, 5000];

export default function AppV3() {
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
    lastMessage: null
  });

  useEffect(() => {
    // Scene 3D avec fond noir pur
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 25);

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
    mountRef.current.appendChild(renderer.domElement);

    // Lumières
    const hemi = new THREE.HemisphereLight(0x77c0ff, 0x061018, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    const root = new THREE.Group();
    scene.add(root);

    // Matériau holographique optimisé (V3)
    const wireframeMaterial = createHolographicWireframeMaterial();
    const materialRef = { current: wireframeMaterial };

    // Loader STL
    const loader = new STLLoader();
    loader.load(
      "/models/Frame_Bolt.stl",
      (geo) => {
        geo.computeVertexNormals();
        geo.center();
        
        const mesh = new THREE.Mesh(geo, wireframeMaterial);
        mesh.scale.set(0.02, 0.02, 0.02); // Scale down le modèle STL
        root.add(mesh);
        
        // Explosion: store vertices pour animation
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

    // WebSocket avec reconnexion robuste
    function connectWebSocket() {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      let msgCount = 0;
      const DEBUG = false;

      ws.onopen = () => {
        console.log("✅ [WS V3] Connecté au serveur V3.0");
        setWsStatus("connected");
        reconnectAttempt.current = 0;
        
        // Heartbeat
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
          
          // Protocol V3 (backward compatible V2)
          if (msg.v !== 3 && msg.v !== 2) {
            console.warn("⚠️  Protocol version mismatch:", msg.v);
            return;
          }

          const { g, dbg, preview } = msg;
          const { rot, zoom, explode, freeze, mode } = g;

          if (DEBUG && msgCount % 60 === 0) {
            console.log(`📊 [Msg ${msgCount}] Mode=${mode}, Hands=${dbg.hands}`);
          }
          msgCount++;

          const s = stateRef.current;
          s.targetRotY += rot.dx;
          s.targetRotX += rot.dy;
          s.targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.targetRotX));
          s.targetDistance = Math.max(1.2, Math.min(12.0, s.targetDistance - zoom.dz));
          s.explode = Math.max(0, Math.min(1, explode));
          s.mode = mode;
          s.freeze = freeze;
          s.lastMessage = msg;

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
          
        console.log(`🔄 Reconnexion dans ${delay}ms... (tentative ${reconnectAttempt.current + 1})`);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempt.current++;
          connectWebSocket();
        }, delay);
      };
    }

    connectWebSocket();

    // Animation loop avec THREE.MathUtils.damp (OPTIMISATION V3)
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Mise à jour shader time
      if (materialRef.current && materialRef.current.uniforms) {
        materialRef.current.uniforms.time.value = elapsedTime;
      }

      const s = stateRef.current;
      
      // OPTIMISATION V3: THREE.MathUtils.damp pour smoothing naturel
      // Plus fluide que lerp linéaire, inertie physique réaliste
      s.rotX = THREE.MathUtils.damp(s.rotX, s.targetRotX, 5, deltaTime);
      s.rotY = THREE.MathUtils.damp(s.rotY, s.targetRotY, 5, deltaTime);
      s.distance = THREE.MathUtils.damp(s.distance, s.targetDistance, 5, deltaTime);

      root.rotation.x = s.rotX;
      root.rotation.y = s.rotY;
      camera.position.z = s.distance;

      // Explosion
      root.traverse((obj) => {
        if (obj.isMesh && obj.userData.applyExplosion) {
          obj.userData.applyExplosion(s.explode);
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Hotkeys
    const handleKeyPress = (e) => {
      const s = stateRef.current;
      switch (e.key.toLowerCase()) {
        case "r":
          s.targetRotX = 0;
          s.targetRotY = 0;
          s.targetDistance = 5.0;
          break;
        case "e":
          s.explode = s.explode > 0.5 ? 0 : 1;
          break;
      }
    };
    window.addEventListener("keypress", handleKeyPress);

    // Fetch metrics périodiquement (V3 feature)
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
      
      {/* Metrics Display V3 */}
      <div style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.7)",
        color: "#0ff",
        padding: "8px 12px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "11px",
        border: "1px solid #0ff",
        display: "flex",
        gap: "12px"
      }}>
        <div>🎯 FPS: {metrics.fps.toFixed(1)}</div>
        <div>⚡ {metrics.latency.toFixed(1)}ms</div>
        <div style={{ 
          color: wsStatus === "connected" ? "#0f0" : 
                 wsStatus === "connecting" ? "#ff0" : "#f00" 
        }}>
          ● V3.0
        </div>
      </div>
    </>
  );
}

// ============================================================
// SHADER HOLOGRAPHIQUE (V3 - Optimisé)
// ============================================================

function createHolographicWireframeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        vPosition = position;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      
      void main() {
        // Couleurs holographiques (cyan électrique uniforme)
        vec3 baseColor = vec3(0.2, 0.9, 1.0); // Cyan lumineux
        vec3 edgeColor = vec3(0.6, 1.0, 1.0); // Cyan très clair (pas blanc pur)
        
        // Effet Fresnel CONTRÔLÉ
        float viewDot = dot(normalize(vNormal), normalize(vViewDir));
        float fresnel = pow(1.0 - abs(viewDot), 2.5);
        fresnel = clamp(fresnel * 0.7, 0.0, 0.7);
        
        // Wireframe procedural NET
        vec3 grid = fract(vPosition * 25.0);
        float gridLine = min(min(grid.x, grid.y), grid.z);
        float wireframe = 1.0 - smoothstep(0.0, 0.05, gridLine);
        
        // Scanlines SUBTILES
        float scanline = sin(vWorldPosition.y * 20.0 + time * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 5.0) * 0.12;
        
        // Pulsation SUBTILE
        float pulse = sin(time * 1.5) * 0.08 + 0.92;
        
        // Composition ÉQUILIBRÉE
        vec3 finalColor = mix(baseColor, edgeColor, fresnel);
        finalColor += vec3(wireframe * 0.7);
        finalColor += vec3(scanline * 0.5);
        finalColor *= pulse;
        
        // Empêcher faces plates blanches
        float flatness = abs(viewDot);
        finalColor = mix(finalColor, baseColor, flatness * 0.3);
        
        // Alpha CONTRÔLÉ
        float alpha = 0.45 + fresnel * 0.35 + wireframe * 0.5;
        alpha = clamp(alpha, 0.35, 0.85);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
