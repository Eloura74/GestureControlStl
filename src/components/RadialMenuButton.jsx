/**
 * RadialMenuButton - Bouton flottant pour ouvrir le menu radial
 * Simple, fiable, toujours accessible
 */

import React, { useState } from 'react';

export default function RadialMenuButton({ onToggle }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '100px',
        left: '30px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        border: '3px solid #00ffff',
        background: isOpen 
          ? 'linear-gradient(135deg, #00ffff 0%, #00aaaa 100%)'
          : 'rgba(0, 20, 40, 0.9)',
        color: isOpen ? '#000' : '#00ffff',
        fontSize: '32px',
        cursor: 'pointer',
        boxShadow: isOpen
          ? '0 0 30px rgba(0, 255, 255, 0.8), inset 0 0 20px rgba(0, 255, 255, 0.3)'
          : '0 0 20px rgba(0, 255, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        transform: isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        animation: isOpen ? 'none' : 'pulse 2s infinite'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = isOpen 
          ? 'rotate(45deg) scale(1.2)' 
          : 'rotate(0deg) scale(1.15)';
        e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 255, 255, 1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isOpen 
          ? 'rotate(45deg) scale(1.1)' 
          : 'rotate(0deg) scale(1)';
        e.currentTarget.style.boxShadow = isOpen
          ? '0 0 30px rgba(0, 255, 255, 0.8)'
          : '0 0 20px rgba(0, 255, 255, 0.5)';
      }}
      title={isOpen ? "Fermer le menu" : "Ouvrir le menu radial (M)"}
    >
      {isOpen ? '✕' : '☰'}
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 35px rgba(0, 255, 255, 0.8);
          }
        }
      `}</style>
    </button>
  );
}
