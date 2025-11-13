import React, { useEffect, useState } from 'react';

/**
 * Guide pour placer les marqueurs de mesure
 */
export default function MeasureGuide() {
  const [markers, setMarkers] = useState({ point1: false, point2: false });

  useEffect(() => {
    const handleMarkerState = (e) => {
      setMarkers(e.detail);
    };

    window.addEventListener('measure:markers', handleMarkerState);

    return () => {
      window.removeEventListener('measure:markers', handleMarkerState);
    };
  }, []);

  // Si les 2 marqueurs sont placés, ne rien afficher
  if (markers.point1 && markers.point2) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '120px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255, 165, 0, 0.2)',
      border: '2px solid rgba(255, 165, 0, 0.8)',
      borderRadius: '10px',
      padding: '15px 30px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffaa00',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 0 20px rgba(255, 165, 0, 0.4)',
      zIndex: 999,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      {!markers.point1 && (
        <div>
          🔴 <span style={{ fontSize: '18px' }}>Placez le marqueur 1</span><br />
          <span style={{ fontSize: '14px', opacity: 0.8 }}>🤘 Main gauche : index + auriculaire levés</span>
        </div>
      )}
      {markers.point1 && !markers.point2 && (
        <div>
          🔵 <span style={{ fontSize: '18px' }}>Placez le marqueur 2</span><br />
          <span style={{ fontSize: '14px', opacity: 0.8 }}>🤘 Main droite : index + auriculaire levés</span>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
