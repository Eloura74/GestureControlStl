# Configuration exemple pour Holo-Control v2
# Copiez ce fichier et ajustez selon vos préférences

# ============================================
# 🌐 SERVEUR WEBSOCKET
# ============================================
WS_HOST = "127.0.0.1"
WS_PORT = 8765
FPS_LIMIT = 30  # Frames par seconde (15-60 recommandé)

# ============================================
# 🎮 SENSIBILITÉ DES GESTES
# ============================================
# Rotation : Contrôle de la rotation du modèle
ROT_GAIN = 0.006  # Défaut: 0.006 | Plus bas = plus précis | Plus haut = plus réactif

# Zoom : Contrôle du zoom (distance mains)
ZOOM_GAIN = 0.002  # Défaut: 0.002 | Plus bas = zoom lent | Plus haut = zoom rapide

# Explosion : Vitesse d'explosion/implosion
EXP_GAIN = 0.02  # Défaut: 0.02 | Plus bas = transition lente | Plus haut = transition rapide

# Lissage : Fluidité des mouvements
SMOOTH = 0.7  # Défaut: 0.7 (0-0.95) | Plus haut = plus lisse mais latence accrue

# ============================================
# 🎚️ STABILISATION (Deadzones & Seuils)
# ============================================
# Deadzone Rotation : Ignore les micro-mouvements
ROT_DEADZONE = 0.004  # Défaut: 0.004 | Augmenter si tremblements

# Seuil Rotation : Mouvement minimum pour activer
ROT_THRESHOLD = 0.008  # Défaut: 0.008 | Augmenter pour éliminer jitter

# Deadzone Zoom : Ignore petites variations distance
ZOOM_DEADZONE = 0.015  # Défaut: 0.015 | Augmenter si zoom instable

# Seuil Zoom : Changement minimum pour activer
ZOOM_THRESHOLD = 0.02  # Défaut: 0.02 | Augmenter pour zoom plus stable

# Décroissance Vélocité : Arrêt progressif
VEL_DECAY = 0.85  # Défaut: 0.85 (0.5-0.95) | Plus bas = arrêt plus rapide

# ============================================
# 📹 WEBCAM PREVIEW
# ============================================
PREVIEW_ENABLE = True  # True/False - Activer l'aperçu webcam

# Fréquence d'envoi : 1 frame tous les N frames
PREVIEW_EVERY = 4  # Défaut: 4 | Plus haut = moins de bande passante

# Résolution preview (largeur, hauteur)
PREVIEW_W, PREVIEW_H = 320, 180  # Défaut: 320x180 | Réduire si lag

# Qualité JPEG (50-100)
PREVIEW_JPEG_QUALITY = 65  # Défaut: 65 | 50=petite taille, 80=haute qualité

# ============================================
# 🤖 MEDIAPIPE HANDS
# ============================================
# Nombre maximum de mains à détecter
MAX_HANDS = 2  # Ne pas changer (2 requis pour zoom)

# Confiance détection (0.0-1.0)
DETECTION_CONFIDENCE = 0.6  # Défaut: 0.6 | Plus bas = détecte plus facilement

# Confiance tracking (0.0-1.0)
TRACKING_CONFIDENCE = 0.6  # Défaut: 0.6 | Plus haut = tracking plus stable

# Complexité du modèle (0 ou 1)
MODEL_COMPLEXITY = 1  # Défaut: 1 | 0=rapide, 1=précis

# ============================================
# 🎥 CAMÉRA
# ============================================
# Index de la caméra (0=défaut, 1=secondaire, etc.)
CAMERA_INDEX = 0

# Résolution caméra (largeur, hauteur)
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720

# ============================================
# 📝 PROFILS PRÉDÉFINIS
# ============================================

# PROFIL: Ultra Précis (contrôle fin, mouvements lents)
"""
ROT_GAIN = 0.003
ZOOM_GAIN = 0.001
ROT_DEADZONE = 0.006
ZOOM_DEADZONE = 0.02
SMOOTH = 0.8
"""

# PROFIL: Réactif (réponse rapide, gestes larges)
"""
ROT_GAIN = 0.01
ZOOM_GAIN = 0.004
ROT_DEADZONE = 0.002
ZOOM_DEADZONE = 0.01
SMOOTH = 0.5
"""

# PROFIL: Performance (faible latence, PC lent)
"""
FPS_LIMIT = 20
PREVIEW_EVERY = 6
PREVIEW_W, PREVIEW_H = 240, 135
PREVIEW_JPEG_QUALITY = 50
MODEL_COMPLEXITY = 0
"""

# PROFIL: Qualité (haute précision, PC puissant)
"""
FPS_LIMIT = 60
PREVIEW_EVERY = 2
PREVIEW_W, PREVIEW_H = 480, 270
PREVIEW_JPEG_QUALITY = 80
MODEL_COMPLEXITY = 1
DETECTION_CONFIDENCE = 0.7
TRACKING_CONFIDENCE = 0.7
"""
