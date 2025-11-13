/**
 * AnnotationControls - Panel de contrôle pour annotations et explosion
 */

import React, { useState } from 'react';

export default function AnnotationControls({ 
  onAnnotationMode, 
  onClearAnnotations,
  onExportAnnotations,
  onExplosionToggle,
  onExplosionAnimate,
  onMenuToggle
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(null);

  const handleAnnotationClick = (mode) => {
    // Toggle : si même mode, désactiver, sinon activer nouveau mode
    const newMode = annotationMode === mode ? null : mode;
    setAnnotationMode(newMode);
    onAnnotationMode(newMode);
    console.log(`🎯 Mode annotation UI: ${newMode || 'désactivé'}`);
  };
  
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Si on ferme le menu, désactiver le mode annotation
    if (!newState && annotationMode !== null) {
      setAnnotationMode(null);
      onAnnotationMode(null);
      console.log('🎯 Mode annotation désactivé (menu fermé)');
    }
    
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  return (
    <>
      {/* Bouton toggle */}
      <button
        onClick={handleToggle}
        style={{
          position: 'fixed',
          top: '190px',
          left: '30px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          border: '3px solid #ff00ff',
          background: isOpen 
            ? 'linear-gradient(135deg, #ff00ff 0%, #aa00aa 100%)'
            : 'rgba(40, 0, 40, 0.9)',
          color: isOpen ? '#000' : '#ff00ff',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: isOpen
            ? '0 0 30px rgba(255, 0, 255, 0.8)'
            : '0 0 20px rgba(255, 0, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
        }}
        title="Outils Avancés"
      >
        {isOpen ? '✕' : '🛠️'}
      </button>

      {/* Panel d'outils */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '270px',
          left: '30px',
          background: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #ff00ff',
          borderRadius: '15px',
          padding: '20px',
          minWidth: '280px',
          boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          color: '#fff',
          fontFamily: 'monospace'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            color: '#ff00ff',
            borderBottom: '1px solid #ff00ff',
            paddingBottom: '10px'
          }}>
            🛠️ OUTILS AVANCÉS
          </div>

          {/* Section Explosion */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '13px', 
              color: '#ffaa00',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              💥 EXPLOSION
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ToolButton
                icon="💥"
                label="Toggle"
                onClick={onExplosionToggle}
                shortcut="E"
              />
              <ToolButton
                icon="🎬"
                label="Animée"
                onClick={onExplosionAnimate}
                shortcut="Shift+E"
              />
            </div>
          </div>

          {/* Section Annotations */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '13px', 
              color: '#00ffff',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              📝 ANNOTATIONS
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ToolButton
                icon="📝"
                label="Note"
                onClick={() => handleAnnotationClick('note')}
                active={annotationMode === 'note'}
                shortcut="N"
              />
              <ToolButton
                icon="➡️"
                label="Flèche"
                onClick={() => handleAnnotationClick('arrow')}
                active={annotationMode === 'arrow'}
                shortcut="Shift+N"
              />
              <ToolButton
                icon="📏"
                label="Mesure"
                onClick={() => handleAnnotationClick('measure')}
                active={annotationMode === 'measure'}
                shortcut="Ctrl+N"
              />
            </div>
          </div>

          {/* Actions */}
          <div>
            <div style={{ 
              fontSize: '13px', 
              color: '#00ff00',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              ⚙️ ACTIONS
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <ToolButton
                icon="🗑️"
                label="Effacer"
                onClick={onClearAnnotations}
                color="#ff0000"
              />
              <ToolButton
                icon="💾"
                label="Export"
                onClick={onExportAnnotations}
                color="#00ff00"
              />
            </div>
          </div>

          {/* Aide */}
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(255, 0, 255, 0.1)',
            borderRadius: '8px',
            fontSize: '10px',
            lineHeight: '1.6',
            color: '#aaa'
          }}>
            <div><strong>Mode Annotation :</strong></div>
            <div>• Cliquez sur le modèle pour placer</div>
            <div>• Mesure : 2 clics pour distance</div>
            <div>• Clic sur label pour supprimer</div>
          </div>
        </div>
      )}
    </>
  );
}

function ToolButton({ icon, label, onClick, active, color, shortcut }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active 
          ? 'linear-gradient(135deg, #00ffff 0%, #0088aa 100%)'
          : color 
            ? `rgba(${color === '#ff0000' ? '255,0,0' : color === '#00ff00' ? '0,255,0' : '0,255,255'}, 0.2)`
            : 'rgba(255, 255, 255, 0.1)',
        border: `2px solid ${active ? '#00ffff' : color || '#666'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        color: active ? '#000' : '#fff',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        minWidth: '70px',
        boxShadow: active ? '0 0 15px rgba(0, 255, 255, 0.5)' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = `0 0 20px ${color || '#00ffff'}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = active ? '0 0 15px rgba(0, 255, 255, 0.5)' : 'none';
      }}
      title={shortcut ? `Raccourci: ${shortcut}` : label}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '9px' }}>{label}</span>
    </button>
  );
}
