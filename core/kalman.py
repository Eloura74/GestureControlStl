"""
Filtre de Kalman 1D pour stabilisation des gestes
Ultra-léger et efficace pour filtrage temps réel
"""

class Kalman1D:
    """
    Filtre de Kalman scalaire (1 dimension)
    Utilisé pour filtrer x, y du poignet et distance pincement
    """
    
    def __init__(self, q=1e-3, r=5e-3, initial_value=0.0):
        """
        Args:
            q: Bruit du processus (process noise) - plus élevé = suit plus les mesures
            r: Bruit de mesure (measurement noise) - plus élevé = plus de lissage
            initial_value: Valeur initiale estimée
        """
        self.q = q  # Process noise covariance
        self.r = r  # Measurement noise covariance
        self.x = initial_value  # État estimé
        self.p = 1.0  # Covariance de l'erreur d'estimation
        
    def update(self, measurement):
        """
        Met à jour le filtre avec une nouvelle mesure
        
        Args:
            measurement: Valeur mesurée
            
        Returns:
            Valeur filtrée (état estimé)
        """
        # Prédiction (dans ce cas simple, on prédit que x reste constant)
        self.p += self.q
        
        # Mise à jour (correction avec la mesure)
        k = self.p / (self.p + self.r)  # Gain de Kalman
        self.x += k * (measurement - self.x)
        self.p *= (1 - k)
        
        return self.x
    
    def reset(self, value=0.0):
        """Réinitialise le filtre"""
        self.x = value
        self.p = 1.0
        
    @property
    def variance(self):
        """Retourne la variance (utile pour deadzone adaptive)"""
        return self.p


class Kalman2D:
    """
    Filtre de Kalman 2D pour position (x, y)
    Utilise deux filtres 1D indépendants
    """
    
    def __init__(self, q=1e-3, r=5e-3):
        self.kf_x = Kalman1D(q, r)
        self.kf_y = Kalman1D(q, r)
        
    def update(self, x, y):
        """
        Filtre une position 2D
        
        Args:
            x, y: Coordonnées mesurées
            
        Returns:
            (x_filtered, y_filtered): Coordonnées filtrées
        """
        x_filt = self.kf_x.update(x)
        y_filt = self.kf_y.update(y)
        return x_filt, y_filt
    
    def reset(self):
        """Réinitialise les deux filtres"""
        self.kf_x.reset()
        self.kf_y.reset()
        
    @property
    def variance(self):
        """Retourne la variance moyenne (pour deadzone adaptive)"""
        return (self.kf_x.variance + self.kf_y.variance) / 2


class AdaptiveDeadzone:
    """
    Deadzone adaptative basée sur la variance du filtre Kalman
    Plus le bruit est élevé, plus la deadzone augmente
    """
    
    def __init__(self, base_deadzone=0.002, scale_factor=100.0):
        """
        Args:
            base_deadzone: Deadzone minimale de base
            scale_factor: Facteur d'échelle pour la variance
        """
        self.base = base_deadzone
        self.scale = scale_factor
        
    def get_threshold(self, variance):
        """
        Calcule la deadzone adaptée au bruit actuel
        
        Args:
            variance: Variance du filtre Kalman
            
        Returns:
            Seuil de deadzone adapté
        """
        return self.base + variance * self.scale
    
    def apply(self, value, variance):
        """
        Applique la deadzone sur une valeur
        
        Args:
            value: Valeur à filtrer
            variance: Variance du filtre Kalman
            
        Returns:
            Valeur filtrée (0 si dans la deadzone)
        """
        threshold = self.get_threshold(variance)
        if abs(value) < threshold:
            return 0.0
        return value


# Test unitaire
if __name__ == "__main__":
    import numpy as np
    import matplotlib.pyplot as plt
    
    print("🧪 Test du filtre de Kalman")
    
    # Simulation : signal + bruit
    t = np.linspace(0, 10, 300)
    signal = np.sin(2 * np.pi * 0.5 * t)  # Sinus 0.5 Hz
    noise = np.random.normal(0, 0.1, len(t))
    measurement = signal + noise
    
    # Filtrage
    kf = Kalman1D(q=1e-3, r=5e-3)
    filtered = [kf.update(m) for m in measurement]
    
    # Affichage
    plt.figure(figsize=(12, 6))
    plt.plot(t, signal, 'g-', label='Signal réel', linewidth=2)
    plt.plot(t, measurement, 'r.', label='Mesures bruitées', alpha=0.5, markersize=3)
    plt.plot(t, filtered, 'b-', label='Kalman filtré', linewidth=2)
    plt.legend()
    plt.xlabel('Temps (s)')
    plt.ylabel('Valeur')
    plt.title('Filtre de Kalman 1D - Débruitage')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('kalman_test.png', dpi=150)
    print("✅ Graphique sauvegardé: kalman_test.png")
    
    # Stats
    error_raw = np.mean((measurement - signal)**2)
    error_filtered = np.mean((np.array(filtered) - signal)**2)
    print(f"\n📊 Erreur quadratique moyenne:")
    print(f"  Brut: {error_raw:.6f}")
    print(f"  Filtré: {error_filtered:.6f}")
    print(f"  Amélioration: {(1 - error_filtered/error_raw)*100:.1f}%")
