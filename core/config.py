"""
Gestionnaire de configuration TOML
Charge et valide la configuration depuis config.toml
"""

import toml
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class Config:
    """
    Classe singleton pour la configuration globale
    Charge config.toml et fournit un accès facile aux paramètres
    """
    
    _instance = None
    _config = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, config_path="config.toml"):
        if Config._config is None:
            self.load(config_path)
    
    def load(self, path="config.toml"):
        """Charge la configuration depuis un fichier TOML"""
        config_file = Path(path)
        
        if not config_file.exists():
            logger.warning(f"Config file not found: {path}, using defaults")
            Config._config = self._get_defaults()
            return
        
        try:
            Config._config = toml.load(config_file)
            logger.info(f"✅ Configuration loaded from {path}")
            self._validate()
        except Exception as e:
            logger.error(f"❌ Error loading config: {e}")
            Config._config = self._get_defaults()
    
    def _validate(self):
        """Valide la configuration chargée"""
        required_sections = ['server', 'camera', 'mediapipe', 'gestures', 'model']
        for section in required_sections:
            if section not in Config._config:
                logger.warning(f"Missing config section: {section}")
    
    def _get_defaults(self):
        """Retourne une configuration par défaut"""
        return {
            'server': {'host': '127.0.0.1', 'port': 8765, 'fps_limit': 30, 'debug_mode': True},
            'camera': {'index': 0, 'profile': 'medium', 'width': 640, 'height': 360, 'fps': 30},
            'mediapipe': {'model_complexity': 1, 'max_num_hands': 2, 
                         'min_detection_confidence': 0.6, 'min_tracking_confidence': 0.6},
            'gestures': {
                'profile': 'balanced',
                'profiles': {
                    'balanced': {
                        'rot_gain': 2.0, 'zoom_gain': 0.5, 'smooth': 0.5,
                        'rot_deadzone': 0.00005, 'zoom_deadzone': 0.002, 'pinch_threshold': 0.08
                    }
                }
            },
            'kalman': {'enabled': True, 'process_noise': 0.001, 'measurement_noise': 0.005},
            'fsm': {'dwell_rotate': 80, 'dwell_zoom': 80, 'dwell_explode': 100, 'dwell_idle': 120},
            'preview': {'enabled': True, 'send_every_n_frames': 4, 'width': 320, 'height': 180, 'jpeg_quality': 65},
            'model': {'path': 'public/models/Frame_Bolt.stl', 'format': 'stl', 'auto_center': True, 'auto_scale': True, 'target_size': 1.2},
            'ui': {'show_hud': True, 'show_webcam_pip': True, 'show_stats': False, 'theme': 'dark'},
            'hotkeys': {'reset_camera': 'r', 'toggle_explode': 'e', 'toggle_pip': 'p', 'toggle_hud': 'h', 'toggle_stats': 'f', 'cycle_profile': 'g'},
            'network': {'ping_interval': 15, 'timeout': 40, 'reconnect_delays': [500, 1000, 2000, 5000, 5000], 'compress': False},
            'logging': {'directory': 'logs', 'max_size_mb': 10, 'backup_count': 5}
        }
    
    def get(self, path: str, default=None):
        """
        Récupère une valeur de configuration par chemin
        
        Args:
            path: Chemin de la config, e.g. "server.port" ou "gestures.profiles.balanced.rot_gain"
            default: Valeur par défaut si le chemin n'existe pas
            
        Returns:
            Valeur de configuration ou default
        """
        keys = path.split('.')
        value = Config._config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value
    
    def get_active_gesture_profile(self):
        """Retourne le profil de gestes actif"""
        active_profile_name = self.get('gestures.profile', 'balanced')
        return self.get(f'gestures.profiles.{active_profile_name}', {})
    
    def set_gesture_profile(self, profile_name):
        """Change le profil de gestes actif"""
        if Config._config and 'gestures' in Config._config:
            available = Config._config['gestures'].get('profiles', {}).keys()
            if profile_name in available:
                Config._config['gestures']['profile'] = profile_name
                logger.info(f"Switched to gesture profile: {profile_name}")
                return True
            else:
                logger.warning(f"Unknown profile: {profile_name}. Available: {list(available)}")
        return False
    
    def save(self, path="config.toml"):
        """Sauvegarde la configuration actuelle dans un fichier TOML"""
        try:
            with open(path, 'w') as f:
                toml.dump(Config._config, f)
            logger.info(f"✅ Configuration saved to {path}")
            return True
        except Exception as e:
            logger.error(f"❌ Error saving config: {e}")
            return False
    
    def reload(self):
        """Recharge la configuration depuis le fichier"""
        self.load()
    
    def dump(self):
        """Affiche la configuration actuelle (debug)"""
        import json
        return json.dumps(Config._config, indent=2)
    
    @property
    def server(self):
        """Accès rapide à la section server"""
        return Config._config.get('server', {})
    
    @property
    def camera(self):
        """Accès rapide à la section camera"""
        return Config._config.get('camera', {})
    
    @property
    def mediapipe(self):
        """Accès rapide à la section mediapipe"""
        return Config._config.get('mediapipe', {})
    
    @property
    def gestures(self):
        """Accès rapide au profil de gestes actif"""
        return self.get_active_gesture_profile()
    
    @property
    def kalman(self):
        """Accès rapide à la section kalman"""
        return Config._config.get('kalman', {})
    
    @property
    def fsm(self):
        """Accès rapide à la section fsm"""
        return Config._config.get('fsm', {})


# Instance globale (singleton)
config = Config()


# Test
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("🧪 Test du gestionnaire de configuration")
    print("=" * 60)
    
    cfg = Config()
    
    print("\n📋 Valeurs de configuration:\n")
    print(f"Server host: {cfg.get('server.host')}")
    print(f"Server port: {cfg.get('server.port')}")
    print(f"Camera profile: {cfg.get('camera.profile')}")
    print(f"Gesture profile: {cfg.get('gestures.profile')}")
    
    print("\n🎮 Profil de gestes actif:")
    profile = cfg.get_active_gesture_profile()
    for key, value in profile.items():
        print(f"  {key}: {value}")
    
    print("\n🔄 Changement de profil vers 'reactive':")
    if cfg.set_gesture_profile('reactive'):
        profile = cfg.get_active_gesture_profile()
        print(f"  ROT_GAIN: {profile.get('rot_gain')}")
        print(f"  ZOOM_GAIN: {profile.get('zoom_gain')}")
    
    print("\n✅ Test terminé !")
