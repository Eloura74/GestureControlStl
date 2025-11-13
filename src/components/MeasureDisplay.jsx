import React, { useEffect, useState } from 'react';

/**
 * Affichage de la mesure de distance entre 2 gestes
 */
export default function MeasureDisplay() {
  const [measure, setMeasure] = useState(null);

  useEffect(() => {
    const handleMeasure = (e) => {
      setMeasure(e.detail);
    };

    window.addEventListener('measure:update', handleMeasure);

    return () => {
      window.removeEventListener('measure:update', handleMeasure);
    };
  }, []);

  if (!measure || !measure.active) {
    return null;
  }

  // Convertir la distance en différentes unités
  const distanceCm = (measure.distance * 100).toFixed(2);
  const distanceM = (measure.distance).toFixed(3);
  const distanceIn = (measure.distance * 39.37).toFixed(2);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, rgba(0, 255, 100, 0.15), rgba(0, 200, 255, 0.15))',
      border: '3px solid rgba(0, 255, 100, 0.9)',
      borderRadius: '15px',
      padding: '30px 50px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      color: '#00ff66',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 0 30px rgba(0, 255, 100, 0.5), inset 0 0 20px rgba(0, 255, 100, 0.1)',
      zIndex: 1000,
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 'normal',
        marginBottom: '10px',
        opacity: 0.8,
        letterSpacing: '2px'
      }}>
        📏 MESURE DE DISTANCE
      </div>
      
      <div style={{
        fontSize: '56px',
        fontWeight: 'bold',
        textShadow: '0 0 20px rgba(0, 255, 100, 1), 0 0 40px rgba(0, 255, 100, 0.5)',
        marginBottom: '15px',
        letterSpacing: '3px'
      }}>
        {distanceCm} cm
      </div>
      
      <div style={{
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'normal',
        opacity: 0.7
      }}>
        <div>{distanceM} m</div>
        <div>|</div>
        <div>{distanceIn} in</div>
      </div>
      
      <div style={{
        marginTop: '15px',
        fontSize: '14px',
        opacity: 0.6,
        fontStyle: 'italic'
      }}>
        ✅ Distance mesurée • Appuyez sur ESC ou R pour réinitialiser
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.02); }
        }
      `}</style>
    </div>
  );
}
