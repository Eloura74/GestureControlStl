# gestures_server.py — WS serveur + preview base64
import asyncio, json, time, base64
import numpy as np
import cv2
import mediapipe as mp
import websockets

WS_HOST = "127.0.0.1"
WS_PORT = 8765
FPS_LIMIT = 30

# MODE DEBUG : Active les logs détaillés
DEBUG_MODE = True
LOG_EVERY_N_FRAMES = 30  # Log toutes les 30 frames

# Gestes : gains/lissages (AUGMENTÉS pour visibilité maximale)
ROT_GAIN = 2.0            # sensibilité rotation (MASSIF pour voir)
ZOOM_GAIN = 0.5           # sensibilité zoom (augmenté)
EXP_GAIN = 0.02           # vitesse explosion
SMOOTH   = 0.3            # lissage (0-1) - très réactif

# Deadzones pour stabilité (RÉDUITES pour plus de réactivité)
ROT_DEADZONE = 0.00005    # deadzone rotation (était 0.002)
ZOOM_DEADZONE = 0.002     # deadzone zoom (était 0.01)
VEL_DECAY = 0.85          # décroissance vélocité pour arrêt progressif

# Preview webcam
PREVIEW_ENABLE = True      # False pour désactiver sans toucher au front
PREVIEW_EVERY  = 4         # envoie 1 frame / 4
PREVIEW_W, PREVIEW_H = 320, 180
PREVIEW_JPEG_QUALITY = 65  # 50-80 recommandé

mp_hands = mp.solutions.hands
clients = set()

def finger_extended(landmarks, tip, pip):
    return landmarks[tip].y < landmarks[pip].y

def fist_closed(landmarks):
    pairs = [(8,6),(12,10),(16,14),(20,18)]
    ext = sum(landmarks[tip].y < landmarks[pip].y for tip, pip in pairs)
    return ext <= 1

def is_pinching(landmarks, thumb_tip=4, index_tip=8, threshold=0.08):
    """Détecte si le pouce et l'index sont en pincement"""
    thumb = np.array([landmarks[thumb_tip].x, landmarks[thumb_tip].y])
    index = np.array([landmarks[index_tip].x, landmarks[index_tip].y])
    distance = np.linalg.norm(thumb - index)
    return distance < threshold

def is_hand_open(landmarks):
    """Détecte si la main est ouverte (tous les doigts étendus)"""
    # Index, majeur, annulaire, auriculaire
    fingers = [(8,6), (12,10), (16,14), (20,18)]
    extended = sum(landmarks[tip].y < landmarks[pip].y for tip, pip in fingers)
    return extended >= 3  # Au moins 3 doigts levés = main ouverte

async def ws_handler(websocket):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)

async def broadcast_loop():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    with mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
        model_complexity=1
    ) as hands:

        prev_wrist = None
        rot_vel = np.array([0.0, 0.0], dtype=np.float32)
        explode_factor = 0.0
        freeze_until = 0.0
        last_send = 0.0
        frame_interval = 1.0 / FPS_LIMIT
        moving_avg_dist = None
        frame_idx = 0

        while True:
            ok, frame = cap.read()
            if not ok:
                await asyncio.sleep(0.01)
                continue

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = hands.process(rgb)

            rot_dx = rot_dy = 0.0
            zoom_delta = 0.0
            frozen = time.time() < freeze_until

            hands_lm = []
            if res.multi_hand_landmarks:
                for hlm in res.multi_hand_landmarks:
                    hands_lm.append(hlm.landmark)

            # ROTATION : Une seule main, mouvement du poignet
            if len(hands_lm) == 1 and not frozen:
                lm = hands_lm[0]
                wrist = np.array([lm[0].x, lm[0].y], dtype=np.float32)
                if prev_wrist is not None:
                    delta = wrist - prev_wrist
                    # Deadzone : ignore micro-mouvements
                    if abs(delta[0]) < ROT_DEADZONE: delta[0] = 0.0
                    if abs(delta[1]) < ROT_DEADZONE: delta[1] = 0.0
                    # Lissage vélocité
                    rot_vel = SMOOTH * rot_vel + (1.0 - SMOOTH) * delta
                    # Application : horizontal pour Y, vertical pour X
                    rot_dx = float(-rot_vel[0] * ROT_GAIN)
                    rot_dy = float(rot_vel[1] * ROT_GAIN)
                prev_wrist = wrist
            else:
                prev_wrist = None
                rot_vel *= VEL_DECAY

            # ZOOM : Deux mains en pincement, distance entre les pincements
            if len(hands_lm) >= 2 and not frozen:
                # Vérifier que les deux mains sont en pincement
                hand1_pinching = is_pinching(hands_lm[0])
                hand2_pinching = is_pinching(hands_lm[1])
                
                if hand1_pinching and hand2_pinching:
                    # Mesurer distance entre les deux pincements (pouce-index)
                    pinch1 = np.array([hands_lm[0][4].x, hands_lm[0][4].y], dtype=np.float32)
                    pinch2 = np.array([hands_lm[1][4].x, hands_lm[1][4].y], dtype=np.float32)
                    dist = float(np.linalg.norm(pinch2 - pinch1))
                    
                    if moving_avg_dist is None:
                        moving_avg_dist = dist
                    diff = dist - moving_avg_dist
                    # Deadzone zoom : ignore petites variations
                    if abs(diff) > ZOOM_DEADZONE:
                        moving_avg_dist = 0.9 * moving_avg_dist + 0.1 * dist
                        # NORMAL : écarter = zoom+, rapprocher = zoom-
                        zoom_delta = diff * ZOOM_GAIN
                else:
                    moving_avg_dist = None
            else:
                moving_avg_dist = None

            # Explosé : index levé de la main 1
            if hands_lm and not frozen:
                idx_up = finger_extended(hands_lm[0], 8, 6)
                explode_factor = float(
                    np.clip(explode_factor + (EXP_GAIN if idx_up else -EXP_GAIN), 0.0, 1.0)
                )

            # Freeze : poing
            if hands_lm and fist_closed(hands_lm[0]):
                freeze_until = time.time() + 0.3

            # Prépare payload
            now = time.time()
            if now - last_send >= frame_interval:
                payload = {
                    "rot_dx": rot_dx,
                    "rot_dy": rot_dy,
                    "zoom_delta": zoom_delta,
                    "explode": explode_factor,
                    "freeze": frozen
                }

                # DEBUG: Logs détaillés
                if DEBUG_MODE and (frame_idx % LOG_EVERY_N_FRAMES == 0):
                    print(f"\n📊 [Frame {frame_idx}] État des gestes:")
                    print(f"  👐 Mains détectées: {len(hands_lm)}")
                    print(f"  🔄 Rotation: rot_dx={rot_dx:.6f}, rot_dy={rot_dy:.6f}")
                    print(f"  🔍 Zoom: zoom_delta={zoom_delta:.6f}")
                    print(f"  💥 Explode: {explode_factor:.2f}")
                    print(f"  ❄️  Freeze: {frozen}")
                    print(f"  📡 Clients connectés: {len(clients)}")
                    has_movement = abs(rot_dx) > 0.001 or abs(rot_dy) > 0.001 or abs(zoom_delta) > 0.001
                    print(f"  ✅ Mouvement détecté: {has_movement}")

                # Optionnel: aperçu webcam
                if PREVIEW_ENABLE and (frame_idx % PREVIEW_EVERY == 0):
                    thumb = cv2.resize(frame, (PREVIEW_W, PREVIEW_H), interpolation=cv2.INTER_AREA)
                    ok_jpg, jpg = cv2.imencode(".jpg", thumb, [int(cv2.IMWRITE_JPEG_QUALITY), PREVIEW_JPEG_QUALITY])
                    if ok_jpg:
                        payload["preview"] = base64.b64encode(jpg.tobytes()).decode("ascii")

                if clients:
                    msg = json.dumps(payload)
                    await asyncio.gather(*(c.send(msg) for c in list(clients)), return_exceptions=True)
                last_send = now

            frame_idx += 1
            await asyncio.sleep(0.0)

async def main():
    print("\n" + "="*60)
    print("🎮 HOLO-CONTROL SERVEUR DE GESTES")
    print("="*60)
    print(f"\n📡 WebSocket: ws://{WS_HOST}:{WS_PORT}")
    print(f"🎯 FPS Limit: {FPS_LIMIT}")
    print(f"🐛 Debug Mode: {'✅ ACTIF' if DEBUG_MODE else '❌ Désactivé'}")
    print(f"\n⚙️  Configuration:")
    print(f"  ROT_GAIN      = {ROT_GAIN}")
    print(f"  ZOOM_GAIN     = {ZOOM_GAIN}")
    print(f"  SMOOTH        = {SMOOTH}")
    print(f"  ROT_DEADZONE  = {ROT_DEADZONE}")
    print(f"  ZOOM_DEADZONE = {ZOOM_DEADZONE}")
    print(f"\n🎮 Gestes:")
    print(f"  - 1 MAIN: Rotation du modèle")
    print(f"  - 2 MAINS en pincement: Zoom")
    print(f"  - Index levé: Explosion")
    print(f"  - Poing fermé: Freeze")
    print("\n" + "="*60)
    print("✅ Serveur démarré ! En attente de connexions...\n")
    
    server = await websockets.serve(ws_handler, WS_HOST, WS_PORT)
    try:
        await broadcast_loop()
    finally:
        server.close()
        await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
