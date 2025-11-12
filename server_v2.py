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

# FastAPI app
app = FastAPI(title="Holo-Control V2.0", version="2.0.0")

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
        """Détecte un poing fermé"""
        pairs = [(8,6), (12,10), (16,14), (20,18)]
        extended = sum(landmarks[tip].y < landmarks[pip].y for tip, pip in pairs)
        return extended <= 1
    
    def finger_extended(self, landmarks, tip, pip):
        """Vérifie si un doigt est levé"""
        return landmarks[tip].y < landmarks[pip].y
    
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
        is_pinch_left = is_pinch_right = False
        is_index_up = False
        
        if num_hands >= 1:
            is_fist = self.is_fist_closed(hands_landmarks[0])
            is_index_up = self.finger_extended(hands_landmarks[0], 8, 6)
            is_pinch_left, _ = self.is_pinching(hands_landmarks[0], 
                                                gestures_cfg.get('pinch_threshold', 0.08))
        
        if num_hands >= 2:
            is_pinch_right, _ = self.is_pinching(hands_landmarks[1],
                                                 gestures_cfg.get('pinch_threshold', 0.08))
        
        # Mise à jour FSM
        current_mode = self.fsm.update(
            hands_detected=num_hands,
            is_fist=is_fist,
            is_pinch_left=is_pinch_left,
            is_pinch_right=is_pinch_right,
            is_index_up=is_index_up
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
        
        # Zoom (si mode ZOOM actif)
        if self.fsm.can_apply_gesture("zoom") and num_hands >= 2:
            pinch1_is, dist1 = self.is_pinching(hands_landmarks[0], gestures_cfg.get('pinch_threshold', 0.08))
            pinch2_is, dist2 = self.is_pinching(hands_landmarks[1], gestures_cfg.get('pinch_threshold', 0.08))
            
            if pinch1_is and pinch2_is:
                p1 = np.array([hands_landmarks[0][4].x, hands_landmarks[0][4].y], dtype=np.float32)
                p2 = np.array([hands_landmarks[1][4].x, hands_landmarks[1][4].y], dtype=np.float32)
                dist_raw = float(np.linalg.norm(p2 - p1))
                
                # Filtrage Kalman optionnel
                if self.kalman_enabled:
                    dist = self.kf_pinch_dist.update(dist_raw)
                    variance = self.kf_pinch_dist.variance
                else:
                    dist = dist_raw
                    variance = 0.0
                
                if self.moving_avg_dist is None:
                    self.moving_avg_dist = dist
                
                diff = dist - self.moving_avg_dist
                
                # Deadzone adaptative
                diff_filtered = self.adaptive_dz_zoom.apply(diff, variance)
                
                if abs(diff_filtered) > 0:
                    self.moving_avg_dist = 0.9 * self.moving_avg_dist + 0.1 * dist
                    zoom_delta = diff_filtered * ZOOM_GAIN
            else:
                self.moving_avg_dist = None
        else:
            self.moving_avg_dist = None
        
        # Explosion (si mode EXPLODE actif)
        if self.fsm.can_apply_gesture("explode") and is_index_up:
            self.explode_factor = float(np.clip(self.explode_factor + EXP_GAIN, 0.0, 1.0))
        else:
            self.explode_factor = float(np.clip(self.explode_factor - EXP_GAIN, 0.0, 1.0))
        
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
            "mode": current_mode.name,
            "freeze": current_mode == GestureMode.FREEZE
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
                        await websocket.send_text(json.dumps({"type": "pong"}))
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


@app.post("/api/shutdown")
async def shutdown_server():
    """Arrête proprement le serveur"""
    logger.info(" Demande d'arrêt du serveur reçue...")
    
    # Fermer tous les clients WebSocket
    for client in list(clients):
        try:
            await client.close()
        except:
            pass
    clients.clear()
    
    # Libérer la caméra
    if gesture_processor and hasattr(gesture_processor, 'cap'):
        if gesture_processor.cap:
            gesture_processor.cap.release()
            logger.info(" Caméra libérée")
    
    # Arrêter le serveur après un court délai
    import asyncio
    asyncio.create_task(stop_server())
    
    return JSONResponse({"status": "Serveur en cours d'arrêt..."})

async def stop_server():
    """Arrête le serveur Uvicorn après un délai"""
    import asyncio
    await asyncio.sleep(1)
    logger.info(" Arrêt du serveur...")
    import os
    import signal
    os.kill(os.getpid(), signal.SIGINT)


@app.on_event("startup")
async def startup():
    """Démarrage du serveur"""
    logger.info("\n" + "="*60)
    logger.info(" HOLO-CONTROL V2.0 - SERVEUR ULTRA-OPTIMISÉ")
    logger.info("🎮 HOLO-CONTROL V2.0 - SERVEUR ULTRA-OPTIMISÉ")
    logger.info("="*60)
    logger.info(f"📡 WebSocket: ws://{config.server.get('host')}:{config.server.get('port')}/ws")
    logger.info(f"🎯 Gesture Profile: {config.get('gestures.profile')}")
    logger.info(f"🔧 Kalman Filter: {'✅ Enabled' if config.kalman.get('enabled') else '❌ Disabled'}")
    logger.info(f"🤖 FSM: Active")
    logger.info("="*60 + "\n")
    
    # Démarrage de la boucle caméra
    asyncio.create_task(camera_loop())


if __name__ == "__main__":
    # Serve static files (build frontend)
    # app.mount("/", StaticFiles(directory="dist", html=True), name="static")
    
    uvicorn.run(
        app,
        host=config.server.get('host', '127.0.0.1'),
        port=config.server.get('port', 8765),
        log_level="info"
    )
