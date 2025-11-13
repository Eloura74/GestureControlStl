/**
 * STL Loader Web Worker
 * Charge les fichiers STL/OBJ en arrière-plan pour éviter de bloquer l'UI
 */

// Import Three.js depuis CDN (pour le worker)
importScripts('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js');
importScripts('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/STLLoader.js');
importScripts('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/loaders/OBJLoader.js');

self.onmessage = async function(e) {
  const { type, url, id } = e.data;
  
  try {
    if (type === 'load_stl') {
      await loadSTL(url, id);
    } else if (type === 'load_obj') {
      await loadOBJ(url, id);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: id,
      error: error.message
    });
  }
};

async function loadSTL(url, id) {
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 0,
    message: 'Téléchargement STL...'
  });
  
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 50,
    message: 'Parsing STL...'
  });
  
  // Parse STL (binary ou ASCII)
  const geometry = parseSTL(buffer);
  
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 100,
    message: 'Chargement terminé'
  });
  
  // Extraire les données de géométrie
  const positions = Array.from(geometry.attributes.position.array);
  const normals = geometry.attributes.normal ? Array.from(geometry.attributes.normal.array) : null;
  
  self.postMessage({
    type: 'loaded',
    id: id,
    geometryData: {
      positions: positions,
      normals: normals,
      vertexCount: positions.length / 3
    }
  });
}

function parseSTL(buffer) {
  const dataView = new DataView(buffer);
  
  // Vérifier si c'est du ASCII ou Binary
  const isASCII = isSTLAscii(buffer);
  
  if (isASCII) {
    return parseSTLAscii(buffer);
  } else {
    return parseSTLBinary(dataView);
  }
}

function isSTLAscii(buffer) {
  const view = new Uint8Array(buffer, 0, 5);
  return (view[0] === 115 && view[1] === 111 && view[2] === 108 && 
          view[3] === 105 && view[4] === 100); // "solid"
}

function parseSTLBinary(dataView) {
  // Binary STL format:
  // 80 bytes header
  // 4 bytes: number of triangles (uint32)
  // For each triangle:
  //   12 bytes: normal (3 * float32)
  //   36 bytes: vertices (3 vertices * 3 coords * float32)
  //   2 bytes: attribute byte count (uint16)
  
  const triangles = dataView.getUint32(80, true);
  const positions = new Float32Array(triangles * 9);
  const normals = new Float32Array(triangles * 9);
  
  let offset = 84;
  
  for (let i = 0; i < triangles; i++) {
    const normalX = dataView.getFloat32(offset, true);
    const normalY = dataView.getFloat32(offset + 4, true);
    const normalZ = dataView.getFloat32(offset + 8, true);
    offset += 12;
    
    for (let v = 0; v < 3; v++) {
      const vIdx = i * 9 + v * 3;
      positions[vIdx] = dataView.getFloat32(offset, true);
      positions[vIdx + 1] = dataView.getFloat32(offset + 4, true);
      positions[vIdx + 2] = dataView.getFloat32(offset + 8, true);
      offset += 12;
      
      normals[vIdx] = normalX;
      normals[vIdx + 1] = normalY;
      normals[vIdx + 2] = normalZ;
    }
    
    offset += 2; // attribute byte count
  }
  
  return {
    attributes: {
      position: { array: positions },
      normal: { array: normals }
    }
  };
}

function parseSTLAscii(buffer) {
  const text = new TextDecoder().decode(buffer);
  const lines = text.split('\n');
  
  const positions = [];
  const normals = [];
  let currentNormal = [0, 0, 0];
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('facet normal')) {
      const parts = line.split(/\s+/);
      currentNormal = [
        parseFloat(parts[2]),
        parseFloat(parts[3]),
        parseFloat(parts[4])
      ];
    } else if (line.startsWith('vertex')) {
      const parts = line.split(/\s+/);
      positions.push(
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      );
      normals.push(...currentNormal);
    }
  }
  
  return {
    attributes: {
      position: { array: new Float32Array(positions) },
      normal: { array: new Float32Array(normals) }
    }
  };
}

async function loadOBJ(url, id) {
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 0,
    message: 'Téléchargement OBJ...'
  });
  
  const response = await fetch(url);
  const text = await response.text();
  
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 50,
    message: 'Parsing OBJ...'
  });
  
  // Parse OBJ (simplifié)
  const geometry = parseOBJ(text);
  
  self.postMessage({
    type: 'progress',
    id: id,
    progress: 100,
    message: 'Chargement terminé'
  });
  
  self.postMessage({
    type: 'loaded',
    id: id,
    geometryData: geometry
  });
}

function parseOBJ(text) {
  const vertices = [];
  const normals = [];
  const faces = [];
  
  const lines = text.split('\n');
  
  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('v ')) {
      const parts = line.split(/\s+/);
      vertices.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (line.startsWith('vn ')) {
      const parts = line.split(/\s+/);
      normals.push([
        parseFloat(parts[1]),
        parseFloat(parts[2]),
        parseFloat(parts[3])
      ]);
    } else if (line.startsWith('f ')) {
      const parts = line.split(/\s+/).slice(1);
      const face = parts.map(p => {
        const indices = p.split('/');
        return {
          v: parseInt(indices[0]) - 1,
          vn: indices.length > 2 ? parseInt(indices[2]) - 1 : -1
        };
      });
      faces.push(face);
    }
  }
  
  // Convertir en géométrie plate
  const positions = [];
  const normalsFlat = [];
  
  for (let face of faces) {
    for (let i = 0; i < 3; i++) {
      const vi = face[i].v;
      const ni = face[i].vn;
      
      positions.push(...vertices[vi]);
      
      if (ni >= 0 && normals[ni]) {
        normalsFlat.push(...normals[ni]);
      } else {
        normalsFlat.push(0, 0, 0);
      }
    }
  }
  
  return {
    positions: positions,
    normals: normalsFlat,
    vertexCount: positions.length / 3
  };
}

console.log('✅ STL Loader Worker initialized');
