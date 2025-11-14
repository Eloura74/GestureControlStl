import React, { useEffect, useState } from 'react';

/**
 * Moniteur de performance V3.0
 * Affiche métriques avancées système
 */
export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    ping: 0,
    frameServer: 0,
    frameClient: 0,
    cpuLoad: 0,
    gpuLoad: 0,
    latency: 0
  });

  const [isVisible, setIsVisible] = useState(false);  // Masqué par défaut

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const updateMetrics = () => {
      const now = performance.now();
      frameCount++;

      // Calcul FPS chaque seconde
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: frameCount,
          frameClient: frameCount
        }));
        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(updateMetrics);
    };

    animationId = requestAnimationFrame(updateMetrics);

    // Écoute messages WebSocket
    const handleHUD = (e) => {
      if (e.detail) {
        setMetrics(prev => ({
          ...prev,
          latency: e.detail.latency || 0,
          hands: e.detail.hands || 0
        }));
      }
    };

    // Écoute messages WS bruts pour ping
    const handleWSMessage = (e) => {
      const data = e.detail;
      if (data && data.ts) {
        const now = Date.now();
        const latency = now - data.ts;
        setMetrics(prev => ({
          ...prev,
          ping: latency,
          frameServer: data.dbg?.frame || 0
        }));
      }
    };

    window.addEventListener('holo:hud', handleHUD);
    window.addEventListener('ws:message', handleWSMessage);

    // Toggle avec touche P
    const handleKeyPress = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('holo:hud', handleHUD);
      window.removeEventListener('ws:message', handleWSMessage);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!isVisible) {
    return (
      <div style={styles.toggleButton} onClick={() => setIsVisible(true)}>
        📊 Stats
      </div>
    );
  }

  // Couleurs selon valeurs
  const fpsColor = metrics.fps >= 55 ? '#00ff00' : metrics.fps >= 30 ? '#ffaa00' : '#ff0000';
  const pingColor = metrics.ping < 30 ? '#00ff00' : metrics.ping < 60 ? '#ffaa00' : '#ff0000';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>⚡ PERFORMANCE MONITOR</span>
        <button style={styles.closeBtn} onClick={() => setIsVisible(false)}>×</button>
      </div>

      <div style={styles.metricsGrid}>
        {/* FPS */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>FPS</div>
          <div style={{...styles.metricValue, color: fpsColor}}>
            {metrics.fps}
          </div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${Math.min(100, (metrics.fps / 60) * 100)}%`,
              backgroundColor: fpsColor
            }} />
          </div>
        </div>

        {/* Ping WebSocket */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>PING</div>
          <div style={{...styles.metricValue, color: pingColor}}>
            {metrics.ping}ms
          </div>
          <div style={styles.metricBar}>
            <div style={{
              ...styles.metricBarFill,
              width: `${Math.min(100, 100 - (metrics.ping / 100) * 100)}%`,
              backgroundColor: pingColor
            }} />
          </div>
        </div>

        {/* Frame Server */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>SERVER</div>
          <div style={styles.metricValue}>
            #{metrics.frameServer}
          </div>
        </div>

        {/* Frame Client */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>CLIENT</div>
          <div style={styles.metricValue}>
            #{metrics.frameClient}
          </div>
        </div>

        {/* Latence */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>LATENCY</div>
          <div style={styles.metricValue}>
            {metrics.latency}ms
          </div>
        </div>

        {/* Mains détectées */}
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>HANDS</div>
          <div style={{
            ...styles.metricValue,
            color: metrics.hands > 0 ? '#00ff00' : '#666'
          }}>
            {metrics.hands || 0}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        Press <kbd style={styles.kbd}>P</kbd> to toggle
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '300px',
    background: 'rgba(0, 20, 40, 0.95)',
    border: '2px solid rgba(0, 255, 255, 0.5)',
    borderRadius: '10px',
    padding: '15px',
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#00ffff',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)',
    zIndex: 1000
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(0, 255, 255, 0.3)'
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#00ffff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '15px'
  },
  metricCard: {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '5px',
    padding: '10px',
    textAlign: 'center'
  },
  metricLabel: {
    fontSize: '10px',
    opacity: 0.7,
    marginBottom: '5px',
    letterSpacing: '1px'
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  metricBar: {
    height: '4px',
    background: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  metricBarFill: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  footer: {
    textAlign: 'center',
    fontSize: '10px',
    opacity: 0.6,
    paddingTop: '10px',
    borderTop: '1px solid rgba(0, 255, 255, 0.2)'
  },
  kbd: {
    background: 'rgba(0, 255, 255, 0.2)',
    padding: '2px 6px',
    borderRadius: '3px',
    border: '1px solid rgba(0, 255, 255, 0.4)',
    fontSize: '11px'
  },
  toggleButton: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: 'rgba(0, 255, 255, 0.2)',
    border: '2px solid rgba(0, 255, 255, 0.5)',
    borderRadius: '8px',
    padding: '10px 15px',
    color: '#00ffff',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    transition: 'all 0.3s'
  }
};
