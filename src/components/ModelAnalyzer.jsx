/**
 * ModelAnalyzer.jsx - Affiche les informations techniques du modèle 3D
 * Volume, surface, dimensions, masse estimée, etc.
 */

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

/**
 * Calcule le volume d'un mesh triangulé (formule du volume signé)
 */
function calculateVolume(geometry) {
  const position = geometry.attributes.position;
  let volume = 0.0;
  
  if (geometry.index) {
    // Geometry avec index
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;
      
      const v1 = new THREE.Vector3(position.array[i0], position.array[i0+1], position.array[i0+2]);
      const v2 = new THREE.Vector3(position.array[i1], position.array[i1+1], position.array[i1+2]);
      const v3 = new THREE.Vector3(position.array[i2], position.array[i2+1], position.array[i2+2]);
      
      volume += signedVolumeOfTriangle(v1, v2, v3);
    }
  } else {
    // Geometry sans index (flat)
    for (let i = 0; i < position.count; i += 3) {
      const v1 = new THREE.Vector3().fromBufferAttribute(position, i);
      const v2 = new THREE.Vector3().fromBufferAttribute(position, i + 1);
      const v3 = new THREE.Vector3().fromBufferAttribute(position, i + 2);
      
      volume += signedVolumeOfTriangle(v1, v2, v3);
    }
  }
  
  return Math.abs(volume);
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.clone().cross(p3)) / 6.0;
}

/**
 * Calcule la surface totale d'un mesh
 */
function calculateSurfaceArea(geometry) {
  const position = geometry.attributes.position;
  let area = 0.0;
  
  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;
      
      const v1 = new THREE.Vector3(position.array[i0], position.array[i0+1], position.array[i0+2]);
      const v2 = new THREE.Vector3(position.array[i1], position.array[i1+1], position.array[i1+2]);
      const v3 = new THREE.Vector3(position.array[i2], position.array[i2+1], position.array[i2+2]);
      
      area += triangleArea(v1, v2, v3);
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      const v1 = new THREE.Vector3().fromBufferAttribute(position, i);
      const v2 = new THREE.Vector3().fromBufferAttribute(position, i + 1);
      const v3 = new THREE.Vector3().fromBufferAttribute(position, i + 2);
      
      area += triangleArea(v1, v2, v3);
    }
  }
  
  return area;
}

function triangleArea(p1, p2, p3) {
  const a = p2.clone().sub(p1);
  const b = p3.clone().sub(p1);
  return a.cross(b).length() / 2.0;
}

/**
 * Analyse un modèle 3D et retourne toutes ses propriétés
 */
export function analyzeModel(model, materialDensity = 1.0) {
  if (!model) return null;
  
  let totalVolume = 0;
  let totalArea = 0;
  let totalVertices = 0;
  let totalTriangles = 0;
  
  const bbox = new THREE.Box3().setFromObject(model);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  
  // Parcourir tous les meshes
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      
      // Calculer volume et surface pour ce mesh
      totalVolume += calculateVolume(geo);
      totalArea += calculateSurfaceArea(geo);
      totalVertices += geo.attributes.position.count;
      
      if (geo.index) {
        totalTriangles += geo.index.count / 3;
      } else {
        totalTriangles += geo.attributes.position.count / 3;
      }
    }
  });
  
  // Masse estimée (volume * densité)
  // Pour l'acier: ~7.85 g/cm³, aluminium: ~2.7 g/cm³, plastique: ~1.2 g/cm³
  const mass = totalVolume * materialDensity;
  
  return {
    volume: totalVolume,
    surfaceArea: totalArea,
    vertices: totalVertices,
    triangles: Math.floor(totalTriangles),
    dimensions: {
      x: size.x,
      y: size.y,
      z: size.z
    },
    center: center,
    mass: mass,
    density: materialDensity
  };
}

export default function ModelAnalyzer({ model, visible, material = 'acier' }) {
  const [analysis, setAnalysis] = useState(null);
  
  useEffect(() => {
    if (!model || !visible) return;
    
    // Densités des matériaux courants (g/cm³)
    const densities = {
      acier: 7.85,
      aluminium: 2.7,
      plastique: 1.2,
      titane: 4.5,
      cuivre: 8.96
    };
    
    const density = densities[material] || 1.0;
    const result = analyzeModel(model, density);
    setAnalysis(result);
    
    console.log('📊 Analyse modèle:', result);
  }, [model, visible, material]);
  
  if (!visible || !analysis) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #00ffff',
      borderRadius: '10px',
      padding: '20px',
      color: '#00ffff',
      fontFamily: 'monospace',
      fontSize: '14px',
      maxWidth: '350px',
      boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000
    }}>
      <div style={{ 
        marginBottom: '15px', 
        fontSize: '18px', 
        fontWeight: 'bold',
        borderBottom: '1px solid #00ffff',
        paddingBottom: '10px'
      }}>
        📊 ANALYSE MODÈLE 3D
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <InfoItem label="Vertices" value={analysis.vertices.toLocaleString()} />
          <InfoItem label="Triangles" value={analysis.triangles.toLocaleString()} />
        </div>
        
        <div style={{ borderTop: '1px solid rgba(0, 255, 255, 0.3)', paddingTop: '10px' }} />
        
        <InfoItem 
          label="Volume" 
          value={`${analysis.volume.toFixed(4)} u³`} 
          note={`≈ ${(analysis.volume * 1000).toFixed(2)} cm³`}
        />
        
        <InfoItem 
          label="Surface" 
          value={`${analysis.surfaceArea.toFixed(4)} u²`}
          note={`≈ ${(analysis.surfaceArea * 100).toFixed(2)} cm²`}
        />
        
        <div style={{ borderTop: '1px solid rgba(0, 255, 255, 0.3)', paddingTop: '10px' }} />
        
        <div style={{ fontSize: '12px', color: '#fff', marginBottom: '5px' }}>
          <strong>Dimensions (u):</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', fontSize: '12px' }}>
          <div>X: {analysis.dimensions.x.toFixed(3)}</div>
          <div>Y: {analysis.dimensions.y.toFixed(3)}</div>
          <div>Z: {analysis.dimensions.z.toFixed(3)}</div>
        </div>
        
        <div style={{ borderTop: '1px solid rgba(0, 255, 255, 0.3)', paddingTop: '10px' }} />
        
        <InfoItem 
          label={`Masse (${material})`}
          value={`${analysis.mass.toFixed(2)} g`}
          note={`${(analysis.mass / 1000).toFixed(3)} kg`}
        />
        
        <div style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
          * Valeurs en unités modèle (u). 1u ≈ 10cm assumé pour conversions.
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, note }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ fontSize: '11px', color: '#aaa' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00ffff' }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: '10px', color: '#666' }}>{note}</div>
      )}
    </div>
  );
}
