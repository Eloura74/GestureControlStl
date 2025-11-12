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

const WS_URL = "ws://127.0.0.1:8765/ws";
const RECONNECT_DELAYS = [500, 1000, 2000, 5000, 5000]; // ms

export default function AppV2() {
  const mountRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimeout = useRef(null);
  
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
    // Scene 3D
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 5, 15);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, 0, stateRef.current.distance);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Lumières
    const hemi = new THREE.HemisphereLight(0x77c0ff, 0x061018, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    const root = new THREE.Group();
    scene.add(root);

    // Matériau Holographique avec Fresnel
    const holoMaterial = createFresnelMaterial();

    // Loader STL
    const loader = new STLLoader();
    loader.load(
      "/models/Frame_Bolt.stl",
      (geo) => {
        geo.computeVertexNormals();
        geo.center();
        const mesh = new THREE.Mesh(geo, holoMaterial);
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
          holoMaterial
        );
        root.add(cube);
        prepareExplode(root);
      }
    );

    // Préparation explosion
    function prepareExplode(group) {
      group.traverse((child) => {
        if (child.isMesh) {
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

        // Reconnexion exponentielle
        if (reconnectAttempt.current < RECONNECT_DELAYS.length) {
          const delay = RECONNECT_DELAYS[reconnectAttempt.current];
          console.log(`🔄 Reconnexion dans ${delay}ms...`);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempt.current++;
            connectWebSocket();
          }, delay);
        } else {
          console.error("❌ Nombre max de reconnexions atteint");
        }
      };
    }

    connectWebSocket();

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      clock.getDelta();

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
        if (child.isMesh) {
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
      if (wsRef.current) wsRef.current.close();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} />
      <GesturesHUD />
      <WebcamPiP />
      <ProfileSelector />
      <StateBadge mode={currentMode} wsStatus={wsStatus} />
    </>
  );
}


/**
 * Crée un matériau holographique avec effet Fresnel
 */
function createFresnelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(0x1cc3ff) },
      edgeColor: { value: new THREE.Color(0x7fd4ff) },
      fresnelPower: { value: 3.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 edgeColor;
      uniform float fresnelPower;
      
      varying vec3 vNormal;
      varying vec3 vViewDir;
      
      void main() {
        float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewDir)), fresnelPower);
        fresnel = clamp(fresnel, 0.0, 1.0);
        
        vec3 color = mix(baseColor, edgeColor, fresnel);
        float alpha = 0.75 + fresnel * 0.25;
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
}
