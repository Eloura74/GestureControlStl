import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three-stdlib";

const WS_URL = "ws://127.0.0.1:8765";

export default function Scene3D(){
  const mountRef = useRef(null);
  const wsRef = useRef(null);
  const stateRef = useRef({
    rotX: 0, rotY: 0,
    targetRotX: 0, targetRotY: 0,
    distance: 4.0, targetDistance: 4.0,
    explode: 0.0,
  });

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0b0f14, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061018, 0.08);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.01, 100);
    camera.position.set(0, 0, stateRef.current.distance);

    const hemi = new THREE.HemisphereLight(0x77c0ff, 0x061018, 0.8);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 2);
    scene.add(dir);

    const grid = new THREE.GridHelper(100, 100, 0x0f3b55, 0x0f3b55);
    grid.material.opacity = 0.25; grid.material.transparent = true;
    scene.add(grid);

    const root = new THREE.Group();
    scene.add(root);

    const holoMat = new THREE.MeshPhysicalMaterial({
      color: 0x1cc3ff,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.5,
      transparent: true,
      opacity: 0.75,
      emissive: new THREE.Color(0x0a6aff),
      emissiveIntensity: 0.25,
      envMapIntensity: 0.6,
      side: THREE.DoubleSide
    });

    // Chargement STL avec fallback cube si absent
    const loader = new STLLoader();
    loader.load(
      "/models/model.stl",
      geo => {
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, holoMat);
        geo.center();
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
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), holoMat);
        root.add(cube);
        prepareExplode(root);
      }
    );

    function prepareExplode(group){
      group.traverse(obj=>{
        if(obj.isMesh && obj.geometry && obj.geometry.isBufferGeometry){
          const g = obj.geometry;
          const pos = g.attributes.position;
          const pos0 = new Float32Array(pos.array.length);
          pos0.set(pos.array);
          g.setAttribute("pos0", new THREE.BufferAttribute(pos0, 3));
          const dirArr = new Float32Array(pos.count*3);
          const v = new THREE.Vector3();
          for(let i=0;i<pos.count;i++){
            v.fromBufferAttribute(pos, i);
            v.normalize();
            dirArr[i*3+0]=v.x; dirArr[i*3+1]=v.y; dirArr[i*3+2]=v.z;
          }
          g.setAttribute("dir", new THREE.BufferAttribute(dirArr, 3));
        }
      });
    }

    function applyExplode(group, factor){
      group.traverse(obj=>{
        if(obj.isMesh && obj.geometry && obj.geometry.isBufferGeometry){
          const g = obj.geometry;
          const pos0 = g.getAttribute("pos0");
          const dir  = g.getAttribute("dir");
          if(!pos0 || !dir) return;
          const pos = g.attributes.position;
          for(let i=0;i<pos.count;i++){
            const x0=pos0.getX(i), y0=pos0.getY(i), z0=pos0.getZ(i);
            const dx=dir.getX(i),  dy=dir.getY(i),  dz=dir.getZ(i);
            pos.setXYZ(i, x0 + dx*factor*0.3, y0 + dy*factor*0.3, z0 + dz*factor*0.3);
          }
          pos.needsUpdate = true;
          g.computeVertexNormals();
        }
      });
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = ()=>console.log("[WS] connected");
    ws.onmessage = (ev)=>{
      try{
        const { rot_dx, rot_dy, zoom_delta, explode } = JSON.parse(ev.data);
        const s = stateRef.current;
        s.targetRotY += rot_dx;
        s.targetRotX += rot_dy;
        s.targetRotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, s.targetRotX));
        s.targetDistance = Math.max(1.2, Math.min(12.0, s.targetDistance - zoom_delta));
        s.explode = Math.max(0, Math.min(1, explode));
      }catch(e){}
    };

    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      clock.getDelta();

      const s = stateRef.current;
      const lerp = (a,b,t)=>a+(b-a)*t;
      s.rotX = lerp(s.rotX, s.targetRotX, 0.15);
      s.rotY = lerp(s.rotY, s.targetRotY, 0.15);
      s.distance = lerp(s.distance, s.targetDistance, 0.15);

      root.rotation.set(s.rotX, s.rotY, 0);
      camera.position.set(0, 0, s.distance);
      camera.lookAt(0,0,0);

      applyExplode(root, s.explode);
      renderer.render(scene, camera);
    }
    animate();

    function onResize(){
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    return ()=>{
      window.removeEventListener("resize", onResize);
      ws && ws.close();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
}
