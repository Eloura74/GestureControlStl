/**
 * HOLO-CONTROL V2.0 - Frontend Ultra-Optimisé
 * React + Three.js + Reconnexion WS robuste + Shader Fresnel
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
const RECONNECT_DELAYS = [500, 1000, 2000, 5000, 5000]; // ms

export default function AppV2() {
  const mountRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  
  const [wsStatus, setWsStatus] = useState("connecting");
  const [currentMode, setCurrentMode] = useState("IDLE");
  
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
    // Scene 3D avec fond noir pur pour effet holographique
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 5, 15);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, 0, stateRef.current.distance);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Max 2x pour performance
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

    // Matériau Wireframe Holographique (avec uniform time)
    const wireframeMaterial = createHolographicWireframeMaterial();
    const materialRef = { current: wireframeMaterial };

    // Loader STL
    const loader = new STLLoader();
    loader.load(
      "/models/Frame_Bolt.stl",
      (geo) => {
        geo.computeVertexNormals();
        geo.center();
        
        // MESH avec matériau wireframe blanc/gris
        const mesh = new THREE.Mesh(geo, wireframeMaterial);
        
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const scale = 1.2 / Math.max(size.x, size.y, size.z || 1);
        mesh.scale.setScalar(scale);
        root.add(mesh);
        prepareExplode(root);
      },
      undefined,
      () => {
        // Fallback: cube
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          wireframeMaterial
        );
        root.add(cube);
        prepareExplode(root);
      }
    );

    // Préparation explosion
    function prepareExplode(group) {
      group.traverse((child) => {
        if (child.isPoints || child.isMesh) {
          const geo = child.geometry;
          const pos = geo.attributes.position;
          const count = pos.count;
          const centers = new Float32Array(count * 3);
          const box = new THREE.Box3().setFromBufferAttribute(pos);
          const center = new THREE.Vector3();
          box.getCenter(center);
          for (let i = 0; i < count; i++) {
            centers[i * 3] = center.x;
            centers[i * 3 + 1] = center.y;
            centers[i * 3 + 2] = center.z;
          }
          geo.setAttribute("center", new THREE.BufferAttribute(centers, 3));
          geo.userData.positions0 = pos.array.slice();
          geo.userData.normals0 = geo.attributes.normal.array.slice();
        }
      });
    }

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
        console.log("✅ [WS] Connecté au serveur V2");
        setWsStatus("connected");
        reconnectAttempt.current = 0;
        
        // Heartbeat pour garder la connexion alive
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: "ping" }));
            } catch (e) {
              console.error("❌ Erreur envoi ping:", e);
            }
          }
        }, 15000); // Ping toutes les 15 secondes
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          
          // Protocol v2
          if (msg.v !== 2) {
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
        
        // Nettoyer heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Reconnexion automatique
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

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Mettre à jour l'uniform time pour l'animation du shader
      if (materialRef.current && materialRef.current.uniforms) {
        materialRef.current.uniforms.time.value = elapsedTime;
      }

      const s = stateRef.current;
      const lerp = (a, b, t) => a + (b - a) * t;
      s.rotX = lerp(s.rotX, s.targetRotX, 0.15);
      s.rotY = lerp(s.rotY, s.targetRotY, 0.15);
      s.distance = lerp(s.distance, s.targetDistance, 0.15);

      root.rotation.x = s.rotX;
      root.rotation.y = s.rotY;
      camera.position.z = s.distance;

      // Explosion
      const factor = s.explode;
      root.traverse((child) => {
        if (child.isPoints || child.isMesh) {
          const g = child.geometry;
          if (!g.userData.positions0) return;
          const pos = g.attributes.position;
          const pos0 = g.userData.positions0;
          const ctr = g.attributes.center;
          for (let i = 0; i < pos.count; i++) {
            const x0 = pos0[i * 3],
              y0 = pos0[i * 3 + 1],
              z0 = pos0[i * 3 + 2];
            const cx = ctr.getX(i),
              cy = ctr.getY(i),
              cz = ctr.getZ(i);
            const dx = x0 - cx,
              dy = y0 - cy,
              dz = z0 - cz;
            pos.setXYZ(
              i,
              x0 + dx * factor * 0.3,
              y0 + dy * factor * 0.3,
              z0 + dz * factor * 0.3
            );
          }
          pos.needsUpdate = true;
          g.computeVertexNormals();
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
        case "r": // Reset camera
          s.targetRotX = 0;
          s.targetRotY = 0;
          s.targetDistance = 4.0;
          break;
        case "e": // Toggle explode
          s.explode = s.explode > 0.5 ? 0 : 1;
          break;
      }
    };
    window.addEventListener("keypress", handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keypress", handleKeyPress);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
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
      <StateBadge mode={currentMode} wsStatus={wsStatus} />
    </>
  );
}


/**
 * Crée un matériau holographique FUTURISTE (cyan + glow + scanlines)
 */
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
        
        // Effet Fresnel CONTRÔLÉ (seulement sur les vrais bords)
        float viewDot = dot(normalize(vNormal), normalize(vViewDir));
        float fresnel = pow(1.0 - abs(viewDot), 2.5);
        fresnel = clamp(fresnel * 0.7, 0.0, 0.7); // Limité à 70% max
        
        // Wireframe procedural NET
        vec3 grid = fract(vPosition * 25.0);
        float gridLine = min(min(grid.x, grid.y), grid.z);
        float wireframe = 1.0 - smoothstep(0.0, 0.05, gridLine);
        
        // Scanlines SUBTILES
        float scanline = sin(vWorldPosition.y * 20.0 + time * 2.0) * 0.5 + 0.5;
        scanline = pow(scanline, 5.0) * 0.12;
        
        // Pulsation SUBTILE
        float pulse = sin(time * 1.5) * 0.08 + 0.92;
        
        // Composition ÉQUILIBRÉE (pas de double fresnel qui crée du blanc)
        vec3 finalColor = mix(baseColor, edgeColor, fresnel);
        finalColor += vec3(wireframe * 0.7);
        finalColor += vec3(scanline * 0.5);
        finalColor *= pulse;
        
        // Empêcher les faces plates de devenir trop blanches
        float flatness = abs(viewDot);
        finalColor = mix(finalColor, baseColor, flatness * 0.3);
        
        // Alpha CONTRÔLÉ
        float alpha = 0.45 + fresnel * 0.35 + wireframe * 0.5;
        alpha = clamp(alpha, 0.35, 0.85); // Max 85% pour éviter blanc opaque
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}
