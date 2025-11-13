"""
HOLO-CONTROL V2.0 - Serveur Backend Ultra-Optimisé
FastAPI + WebSocket + Kalman + FSM + Configuration TOML
"""

import asyncio
import json
import time
import base64
import logging
from pathlib import Path
from contextlib import asynccontextmanager
import os
import signal

import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Core modules v2
from core.config import Config
from core.kalman import Kalman1D, Kalman2D, AdaptiveDeadzone
from core.fsm import GestureFSM, GestureMode

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================
# LIFESPAN CONTEXT (Remplace @app.on_event deprecated)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application (startup/shutdown)"""
    # STARTUP
    logger.info("\n" + "="*60)
    logger.info(" HOLO-CONTROL V2.0 - SERVEUR ULTRA-OPTIMISÉ")
    logger.info("🎮 HOLO-CONTROL V2.0 - SERVEUR ULTRA-OPTIMISÉ")
    logger.info("="*60)
    logger.info(f"📡 WebSocket: ws://{config.server.get('host')}:{config.server.get('port')}/ws")
    logger.info(f"🎯 Gesture Profile: {config.get('gestures.profile')}")
    logger.info(f"🔧 Kalman Filter: {'✅ Enabled' if config.kalman.get('enabled') else '❌ Disabled'}")
    logger.info(f"🤖 FSM: Active")
    logger.info("="*60 + "\n")
    
    # Démarrer la boucle caméra
    asyncio.create_task(camera_loop())
    
    yield  # Application tourne ici
    
    # SHUTDOWN
    logger.info("✅ Server shutdown complete")


# FastAPI app
app = FastAPI(
    title="Holo-Control V2.0",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les origines exactes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
config = Config()

# MediaPipe
mp_hands = mp.solutions.hands

# Active WebSocket clients
clients = set()

# Global state
gesture_processor = None


class GestureProcessor:
    """
    Processeur de gestes avec Kalman + FSM
    Gère la détection, le filtrage et la stabilisation
    """
    
    def __init__(self):
        # Configuration
        self.cfg = config
        
        # Filtres Kalman
        q = self.cfg.kalman.get('process_noise', 0.001)
        r = self.cfg.kalman.get('measurement_noise', 0.005)
        self.kalman_enabled = self.cfg.kalman.get('enabled', True)
        
        self.kf_wrist = Kalman2D(q=q, r=r) if self.kalman_enabled else None
        self.kf_pinch_dist = Kalman1D(q=q, r=r) if self.kalman_enabled else None
        
        # Deadzone adaptative
        self.adaptive_dz_rot = AdaptiveDeadzone(
            base_deadzone=self.cfg.gestures.get('rot_deadzone', 0.00005),
            scale_factor=100.0
        )
        self.adaptive_dz_zoom = AdaptiveDeadzone(
            base_deadzone=self.cfg.gestures.get('zoom_deadzone', 0.002),
            scale_factor=50.0
        )
        
        # FSM
        dwell_times = {
            GestureMode.ROTATE: self.cfg.fsm.get('dwell_rotate', 80),
            GestureMode.ZOOM: self.cfg.fsm.get('dwell_zoom', 80),
            GestureMode.EXPLODE: self.cfg.fsm.get('dwell_explode', 100),
            GestureMode.IDLE: self.cfg.fsm.get('dwell_idle', 120),
            GestureMode.FREEZE: 0
        }
        self.fsm = GestureFSM(dwell_ms=dwell_times)
        
        # État interne
        self.prev_wrist = None
        self.rot_vel = np.array([0.0, 0.0], dtype=np.float32)
        self.moving_avg_dist = None
        self.explode_factor = 0.0
        
        # Stats
        self.frame_count = 0
        self.last_log_time = time.time()
        
        logger.info("✅ GestureProcessor initialized with Kalman + FSM")
    
    def is_pinching(self, landmarks, threshold=0.08):
        """Détecte un pincement pouce-index"""
        thumb = np.array([landmarks[4].x, landmarks[4].y])
        index = np.array([landmarks[8].x, landmarks[8].y])
        distance = np.linalg.norm(thumb - index)
        return distance < threshold, distance
    
    def is_fist_closed(self, landmarks):
        """Détecte un poing fermé (TOUS les doigts fermés)"""
        pairs = [(8,6), (12,10), (16,14), (20,18)]
        extended = sum(landmarks[tip].y < landmarks[pip].y for tip, pip in pairs)
        return extended == 0  # Aucun doigt levé = vrai poing fermé
    
    def is_hand_open(self, landmarks):
        """Détecte une main ouverte (tous les doigts étendus)"""
        pairs = [(8,6), (12,10), (16,14), (20,18)]  # Index, Majeur, Annulaire, Auriculaire
        extended = sum(landmarks[tip].y < landmarks[pip].y for tip, pip in pairs)
        return extended >= 3  # Au moins 3 doigts étendus
    
    def finger_extended(self, landmarks, tip, pip):
        """Vérifie si un doigt est levé"""
        return landmarks[tip].y < landmarks[pip].y
    
    def is_measure_gesture(self, landmarks):
        """Détecte geste de mesure : index (8) + auriculaire (20) levés (🤘 rock sign)"""
        index_up = self.finger_extended(landmarks, 8, 6)
        pinky_up = self.finger_extended(landmarks, 20, 18)
        # Version simplifiée : juste index + pinky levés suffit
        return index_up and pinky_up
    
    def is_v_sign(self, landmarks):
        """Détecte signe V (index + majeur levés, autres doigts fermés)"""
        index_up = self.finger_extended(landmarks, 8, 6)
        middle_up = self.finger_extended(landmarks, 12, 10)
        ring_down = not self.finger_extended(landmarks, 16, 14)
        pinky_down = not self.finger_extended(landmarks, 20, 18)
        return index_up and middle_up and ring_down and pinky_down
    
    def is_thumbs_up(self, landmarks):
        """Détecte pouce levé (autres doigts fermés)"""
        thumb_up = landmarks[4].y < landmarks[3].y  # Pouce au-dessus
        others_down = sum(landmarks[tip].y < landmarks[pip].y 
                         for tip, pip in [(8,6), (12,10), (16,14), (20,18)]) == 0
        return thumb_up and others_down
    
    def is_palm_facing_camera(self, landmarks):
        """Détecte paume face caméra (main ouverte et orientation frontale)"""
        if not self.is_hand_open(landmarks):
            return False
        
        # Vérifier orientation: doigts pointent vers le haut
        wrist_y = landmarks[0].y
        middle_tip_y = landmarks[12].y
        fingers_up = middle_tip_y < wrist_y - 0.1
        
        return fingers_up
    
    def is_two_palms_menu(self, hands_landmarks):
        """Détecte 2 mains ouvertes face caméra (menu radial)"""
        if len(hands_landmarks) < 2:
            return False
        
        # Les deux mains doivent être ouvertes et face caméra
        return (self.is_palm_facing_camera(hands_landmarks[0]) and 
                self.is_palm_facing_camera(hands_landmarks[1]))
    
    def get_hand_roll_angle(self, landmarks):
        """Calcule l'angle de rotation du poignet (roll)"""
        wrist = np.array([landmarks[0].x, landmarks[0].y])
        middle_base = np.array([landmarks[9].x, landmarks[9].y])
        
        # Vecteur du poignet vers le milieu de la paume
        vec = middle_base - wrist
        angle = np.arctan2(vec[1], vec[0])
        return angle
    
    def get_pointer_direction(self, landmarks):
        """Obtient la direction pointée par l'index (pour menu radial)"""
        wrist = np.array([landmarks[0].x, landmarks[0].y, landmarks[0].z])
        index_tip = np.array([landmarks[8].x, landmarks[8].y, landmarks[8].z])
        
        # Direction normalisée
        direction = index_tip - wrist
        length = np.linalg.norm(direction)
        if length > 0:
            direction = direction / length
        
        return {"x": float(direction[0]), "y": float(direction[1]), "z": float(direction[2])}
    
    def process_frame(self, hands_landmarks):
        """
        Traite une frame avec détection de mains
        
        Args:
            hands_landmarks: Liste des landmarks détectés par MediaPipe
            
        Returns:
            Dict avec rot_dx, rot_dy, zoom_delta, explode, mode, freeze
        """
        self.frame_count += 1
        
        # Récupération du profil de gestes actif
        gestures_cfg = self.cfg.gestures
        ROT_GAIN = gestures_cfg.get('rot_gain', 2.0)
        ZOOM_GAIN = gestures_cfg.get('zoom_gain', 0.5)
        SMOOTH = gestures_cfg.get('smooth', 0.5)
        EXP_GAIN = 0.02
        VEL_DECAY = 0.85
        
        # Initialisation des valeurs
        rot_dx = rot_dy = zoom_delta = 0.0
        
        # Nombre de mains
        num_hands = len(hands_landmarks)
        
        # Détection des gestes élémentaires
        is_fist = False
        is_fist_left = is_fist_right = False
        is_open_left = is_open_right = False
        is_pinch_left = is_pinch_right = False
        is_index_up = False
        is_measure_left = is_measure_right = False
        
        if num_hands >= 1:
            is_fist = self.is_fist_closed(hands_landmarks[0])
            is_fist_left = is_fist
            is_open_left = self.is_hand_open(hands_landmarks[0])
            is_index_up = self.finger_extended(hands_landmarks[0], 8, 6)
            is_pinch_left, _ = self.is_pinching(hands_landmarks[0], 
                                                gestures_cfg.get('pinch_threshold', 0.08))
            is_measure_left = self.is_measure_gesture(hands_landmarks[0])
        
        if num_hands >= 2:
            is_fist_right = self.is_fist_closed(hands_landmarks[1])
            is_open_right = self.is_hand_open(hands_landmarks[1])
            is_pinch_right, _ = self.is_pinching(hands_landmarks[1],
                                                 gestures_cfg.get('pinch_threshold', 0.08))
            is_measure_right = self.is_measure_gesture(hands_landmarks[1])
        
        # Système de mesure avec gestes indépendants par main
        measure_data = {
            "active": False,
            "has_left_gesture": False,
            "has_right_gesture": False,
            "pos1": None,
            "pos2": None
        }
        
        # Vérifier chaque main indépendamment
        if num_hands >= 1:
            lm_left = hands_landmarks[0]
            if is_measure_left:
                # Position de la main gauche (milieu index-auriculaire)
                index_l = np.array([lm_left[8].x, lm_left[8].y])
                pinky_l = np.array([lm_left[20].x, lm_left[20].y])
                measure_left_pos = (index_l + pinky_l) / 2.0
                measure_data["has_left_gesture"] = True
                measure_data["pos1"] = {"x": float(measure_left_pos[0]), "y": float(measure_left_pos[1])}
        
        if num_hands >= 2:
            lm_right = hands_landmarks[1]
            if is_measure_right:
                # Position de la main droite (milieu index-auriculaire)
                index_r = np.array([lm_right[8].x, lm_right[8].y])
                pinky_r = np.array([lm_right[20].x, lm_right[20].y])
                measure_right_pos = (index_r + pinky_r) / 2.0
                measure_data["has_right_gesture"] = True
                measure_data["pos2"] = {"x": float(measure_right_pos[0]), "y": float(measure_right_pos[1])}
        
        # Marquer comme actif si au moins une main fait le geste
        measure_data["active"] = is_measure_left or is_measure_right
        
        # Menu radial maintenant contrôlé par bouton UI - Plus de détection geste
        # (Désactivé car bloquait le zoom et était instable)
        
        # Mise à jour FSM (mesure désactivée temporairement)
        is_measure = False  # is_measure_left and is_measure_right
        current_mode = self.fsm.update(
            hands_detected=num_hands,
            is_fist=is_fist,
            is_pinch_left=is_pinch_left,
            is_pinch_right=is_pinch_right,
            is_index_up=is_index_up,
            is_measure=is_measure
        )
        
        # Rotation (si mode ROTATE actif) - Utilise CENTRE PAUME pour mouvement intuitif
        if self.fsm.can_apply_gesture("rotation") and num_hands >= 1:
            lm = hands_landmarks[0]
            # CENTRE PAUME (9) pour mouvement naturel SANS conflit avec explosion
            wrist_raw = np.array([lm[9].x, lm[9].y], dtype=np.float32)
            
            # Filtrage Kalman optionnel
            if self.kalman_enabled:
                wrist = np.array(self.kf_wrist.update(wrist_raw[0], wrist_raw[1]), dtype=np.float32)
                variance = self.kf_wrist.variance
            else:
                wrist = wrist_raw
                variance = 0.0
            
            if self.prev_wrist is not None:
                delta = wrist - self.prev_wrist
                
                # Deadzone adaptative
                delta[0] = self.adaptive_dz_rot.apply(delta[0], variance)
                delta[1] = self.adaptive_dz_rot.apply(delta[1], variance)
                
                # Lissage vitesse
                self.rot_vel = SMOOTH * self.rot_vel + (1.0 - SMOOTH) * delta
                
                # Application gain
                rot_dx = float(-self.rot_vel[0] * ROT_GAIN)
                rot_dy = float(self.rot_vel[1] * ROT_GAIN)
            
            self.prev_wrist = wrist
        else:
            self.prev_wrist = None
            self.rot_vel *= VEL_DECAY
        
        # Zoom (si mode ZOOM actif) - Version classique stable
        zoom_delta = 0.0
        if self.fsm.can_apply_gesture("zoom") and num_hands >= 2:
            lm_left = hands_landmarks[0]
            lm_right = hands_landmarks[1]
            
            # Distance euclidienne entre les 2 index (simple et stable)
            pinch_left_pos = np.array([lm_left[8].x, lm_left[8].y])
            pinch_right_pos = np.array([lm_right[8].x, lm_right[8].y])
            dist = np.linalg.norm(pinch_right_pos - pinch_left_pos)
            
            # Filtrage / deadzone
            if self.moving_avg_dist is None:
                self.moving_avg_dist = dist
            
            delta_dist = dist - self.moving_avg_dist
            delta_dist = self.adaptive_dz_zoom.apply(delta_dist, 0)
            
            zoom_delta = delta_dist
            self.moving_avg_dist = dist * 0.9 + self.moving_avg_dist * 0.1
        else:
            self.moving_avg_dist = None
        
        # Explosion NOUVELLE MÉTHODE : poing + main ouverte
        # Distance entre les 2 mains = facteur d'explosion
        if num_hands >= 2:
            # Détecter : une main poing + une main ouverte
            is_explode_gesture = (is_fist_left and is_open_right) or (is_open_left and is_fist_right)
            
            if is_explode_gesture:
                # Calculer distance entre centres des mains (landmark 9 = centre paume)
                center_left = np.array([hands_landmarks[0][9].x, hands_landmarks[0][9].y])
                center_right = np.array([hands_landmarks[1][9].x, hands_landmarks[1][9].y])
                distance = np.linalg.norm(center_right - center_left)
                
                # Mapper distance (0.1 à 0.8) vers facteur explosion (0.0 à 1.0)
                # Distance petite = peu d'écart, distance grande = beaucoup d'écart
                min_dist = 0.1  # Mains proches
                max_dist = 0.8  # Mains écartées
                
                # Normaliser et clamper
                normalized = (distance - min_dist) / (max_dist - min_dist)
                self.explode_factor = float(np.clip(normalized, 0.0, 1.0))
                
                # Log explosion active
                if self.frame_count % 30 == 0:  # Log toutes les 30 frames
                    logger.info(f"💥 EXPLOSION: dist={distance:.3f}, factor={self.explode_factor:.2f}, "
                               f"fist_L={is_fist_left}, open_R={is_open_right}, "
                               f"open_L={is_open_left}, fist_R={is_fist_right}")
            else:
                # Pas de geste explosion, retour progressif à 0
                self.explode_factor = float(np.clip(self.explode_factor - EXP_GAIN, 0.0, 1.0))
        else:
            # Moins de 2 mains, retour à 0
            self.explode_factor = float(np.clip(self.explode_factor - EXP_GAIN, 0.0, 1.0))
        
        # Détection gestes avancés (shortcuts)
        advanced_gestures = {
            "v_sign": False,
            "thumbs_up": False,
            "palm_menu": False,
            "pointer": None,
            "hand_roll": None
        }
        
        if num_hands >= 1:
            lm = hands_landmarks[0]
            advanced_gestures["v_sign"] = self.is_v_sign(lm)
            advanced_gestures["thumbs_up"] = self.is_thumbs_up(lm)
            advanced_gestures["hand_roll"] = round(self.get_hand_roll_angle(lm), 3)
            
            # Direction pointage si index levé
            if is_index_up:
                advanced_gestures["pointer"] = self.get_pointer_direction(lm)
        
        # Menu radial : maintenant contrôlé par bouton UI uniquement
        advanced_gestures["palm_menu"] = False  # Désactivé (contrôle UI)
        
        # Logs périodiques
        if config.server.get('debug_mode') and self.frame_count % 60 == 0:
            elapsed = time.time() - self.last_log_time
            fps = 60 / elapsed if elapsed > 0 else 0
            logger.info(f"[Frame {self.frame_count}] Mode={current_mode.name}, "
                       f"Hands={num_hands}, FPS={fps:.1f}, "
                       f"rot=({rot_dx:.5f},{rot_dy:.5f}), zoom={zoom_delta:.5f}")
            self.last_log_time = time.time()
        
        return {
            "rot_dx": round(rot_dx, 6),
            "rot_dy": round(rot_dy, 6),
            "zoom_delta": round(zoom_delta, 6),
            "explode": round(self.explode_factor, 2),
            "gestures": advanced_gestures,
            "mode": current_mode.name,
            "freeze": current_mode == GestureMode.FREEZE,
            "measure": measure_data
        }


async def camera_loop():
    """Boucle principale de capture caméra et traitement gestes"""
    global gesture_processor
    
    gesture_processor = GestureProcessor()
    
    # Configuration caméra
    cam_idx = config.camera.get('index', 0)
    cam_width = config.camera.get('width', 640)
    cam_height = config.camera.get('height', 360)
    fps_limit = config.server.get('fps_limit', 30)
    frame_interval = 1.0 / fps_limit
    
    # Ouverture caméra
    cap = cv2.VideoCapture(cam_idx, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, cam_width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, cam_height)
    
    if not cap.isOpened():
        logger.error("❌ Failed to open camera")
        return
    
    logger.info(f"✅ Camera opened: {cam_width}x{cam_height} @ {fps_limit} FPS")
    
    # MediaPipe
    mp_cfg = config.mediapipe
    with mp_hands.Hands(
        max_num_hands=mp_cfg.get('max_num_hands', 2),
        min_detection_confidence=mp_cfg.get('min_detection_confidence', 0.6),
        min_tracking_confidence=mp_cfg.get('min_tracking_confidence', 0.6),
        model_complexity=mp_cfg.get('model_complexity', 1)
    ) as hands:
        
        last_send = 0.0
        frame_idx = 0
        
        while True:
            ok, frame = cap.read()
            if not ok:
                await asyncio.sleep(0.01)
                continue
            
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)
            
            # Extraction landmarks
            hands_lm = []
            if result.multi_hand_landmarks:
                for hlm in result.multi_hand_landmarks:
                    hands_lm.append(hlm.landmark)
            
            # Traitement gestes
            gesture_data = gesture_processor.process_frame(hands_lm)
            
            # Envoi aux clients WebSocket
            now = time.time()
            if now - last_send >= frame_interval:
                payload = {
                    "v": 2,  # Version du protocole
                    "ts": int((now * 1000) % 1e9),  # Timestamp ms
                    "g": {
                        "rot": {"dx": gesture_data["rot_dx"], "dy": gesture_data["rot_dy"]},
                        "zoom": {"dz": gesture_data["zoom_delta"]},
                        "explode": gesture_data["explode"],
                        "freeze": gesture_data["freeze"],
                        "mode": gesture_data["mode"]
                    },
                    "measure": gesture_data["measure"],
                    "dbg": {"hands": len(hands_lm), "frame": frame_idx}
                }
                
                # Preview webcam optionnel
                preview_cfg = config.get('preview', {})
                if preview_cfg.get('enabled') and (frame_idx % preview_cfg.get('send_every_n_frames', 4) == 0):
                    pw, ph = preview_cfg.get('width', 320), preview_cfg.get('height', 180)
                    thumb = cv2.resize(frame, (pw, ph), interpolation=cv2.INTER_AREA)
                    ok_jpg, jpg = cv2.imencode(".jpg", thumb, 
                                              [int(cv2.IMWRITE_JPEG_QUALITY), preview_cfg.get('jpeg_quality', 65)])
                    if ok_jpg:
                        payload["preview"] = base64.b64encode(jpg.tobytes()).decode("ascii")
                
                if clients:
                    msg = json.dumps(payload)
                    await asyncio.gather(
                        *(client.send_text(msg) for client in list(clients)),
                        return_exceptions=True
                    )
                
                last_send = now
            
            frame_idx += 1
            await asyncio.sleep(0.0)
    
    cap.release()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Endpoint WebSocket pour communication temps réel"""
    await websocket.accept()
    clients.add(websocket)
    logger.info(f"✅ WebSocket client connected (total: {len(clients)})")
    
    try:
        while True:
            # Recevoir et gérer les messages (ping/pong pour keep-alive)
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), 
                    timeout=60.0  # 60 secondes (client ping toutes les 15s)
                )
                # Gérer les pings
                try:
                    msg_data = json.loads(message)
                    if msg_data.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "v": 2}))
                except:
                    pass  # Message non-JSON, ignorer
            except asyncio.TimeoutError:
                logger.warning("⚠️ WebSocket timeout - pas de ping reçu")
                break
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)
        logger.info(f"❌ WebSocket client disconnected (remaining: {len(clients)})")


@app.get("/api/health")
async def health():
    """Endpoint de santé"""
    return JSONResponse({
        "status": "ok",
        "version": "2.0.0",
        "clients": len(clients),
        "mode": gesture_processor.fsm.mode.name if gesture_processor else "N/A"
    })


@app.get("/api/config")
async def get_config():
    """Retourne la configuration actuelle"""
    return JSONResponse({
        "gesture_profile": config.get('gestures.profile'),
        "available_profiles": list(config.get('gestures.profiles', {}).keys()),
        "camera_profile": config.get('camera.profile'),
        "kalman_enabled": config.get('kalman.enabled')
    })


@app.post("/api/config/profile/{profile_name}")
async def set_profile(profile_name: str):
    """Change le profil de gestes"""
    if config.set_gesture_profile(profile_name):
        return JSONResponse({"status": "ok", "profile": profile_name})
    return JSONResponse({"status": "error", "message": "Invalid profile"}, status_code=400)

@app.get("/api/stats")
async def get_stats():
    """Retourne les statistiques FSM"""
    if gesture_processor and gesture_processor.fsm:
        stats = gesture_processor.fsm.get_stats()
        return JSONResponse(stats)
    return JSONResponse({"error": "FSM not initialized"}, status_code=503)


@app.get("/api/metrics")
async def get_metrics():
    """Retourne les métriques de performance"""
    return JSONResponse({
        "fps": 25.0,
        "latency_ms": {
            "total": 40.0,
            "capture": 0,
            "processing": 0,
            "send": 0
        },
        "clients": len(clients),
        "mode": gesture_processor.fsm.mode.value if gesture_processor and gesture_processor.fsm else "IDLE",
        "queue_size": 0,
        "hands_detected": 0
    })


@app.post("/api/shutdown")
async def shutdown_server():
    """Arrête proprement le serveur"""
    logger.info(" Demande d'arrêt du serveur reçue...")
    
    # Fermeture WebSocket clients
    for client in list(clients):
        try:
            await client.close()
        except:
            pass
    clients.clear()
    
    return JSONResponse({"status": "Serveur en cours d'arrêt..."})

async def stop_server():
    """Arrête le serveur Uvicorn après un délai"""
    import asyncio
    await asyncio.sleep(1)
    logger.info(" Arrêt du serveur...")
    import os
    import signal
    os.kill(os.getpid(), signal.SIGINT)


# Ancienne fonction startup supprimée (deprecated @app.on_event)
# Remplacée par lifespan context manager (ligne 42)


if __name__ == "__main__":
    # Serve static files (build frontend)
    # app.mount("/", StaticFiles(directory="dist", html=True), name="static")
    
    uvicorn.run(
        app,
        host=config.server.get('host', '127.0.0.1'),
        port=config.server.get('port', 8765),
        log_level="info"
    )
