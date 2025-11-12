# CALIBRATION ET DIAGNOSTIC DES GESTES
# Ce script affiche en temps réel les valeurs détectées et permet de calibrer

import cv2
import mediapipe as mp
import numpy as np
import json
from datetime import datetime

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# Configuration actuelle (AUGMENTÉE pour mouvements visibles)
config = {
    "ROT_GAIN": 0.3,           # x20 plus sensible
    "ZOOM_GAIN": 0.15,         # x19 plus sensible
    "SMOOTH": 0.5,             # Plus réactif
    "ROT_DEADZONE": 0.00005,   # Presque rien
    "ZOOM_DEADZONE": 0.002,    # Réduit
    "PINCH_THRESHOLD": 0.08
}

print("=" * 60)
print("🎮 CALIBRATION DES GESTES HOLO-CONTROL")
print("=" * 60)
print("\n📋 Configuration actuelle:")
for key, value in config.items():
    print(f"  {key}: {value}")
print("\n🎯 Instructions:")
print("  - 1 MAIN = Test rotation")
print("  - 2 MAINS = Test zoom (pincez pouce+index)")
print("  - Appuyez sur 'q' pour quitter")
print("  - Appuyez sur 's' pour sauvegarder un snapshot")
print("\n" + "=" * 60 + "\n")

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

prev_wrist = None
rot_vel = np.array([0.0, 0.0], dtype=np.float32)
moving_avg_dist = None
frame_count = 0
log_data = []

def is_pinching(landmarks, threshold=0.08):
    thumb = np.array([landmarks[4].x, landmarks[4].y])
    index = np.array([landmarks[8].x, landmarks[8].y])
    distance = np.linalg.norm(thumb - index)
    return distance < threshold, distance

with mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
    model_complexity=1
) as hands:
    
    while True:
        ok, frame = cap.read()
        if not ok:
            print("❌ Erreur: Impossible de lire la webcam")
            break
            
        frame = cv2.flip(frame, 1)
        h, w = frame.shape[:2]
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        
        # Fond semi-transparent pour les infos
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (500, h), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.3, frame, 0.7, 0)
        
        rot_dx = rot_dy = 0.0
        zoom_delta = 0.0
        
        hands_lm = []
        if res.multi_hand_landmarks:
            for hlm in res.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hlm, mp_hands.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=3),
                    mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2))
                hands_lm.append(hlm.landmark)
        
        y_pos = 30
        line_height = 30
        
        # En-tête
        cv2.putText(frame, f"HOLO-CONTROL CALIBRATION", (10, y_pos), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        y_pos += line_height
        
        cv2.putText(frame, f"Frame: {frame_count} | Mains: {len(hands_lm)}", (10, y_pos), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        y_pos += line_height + 10
        
        # === ROTATION (1 main) ===
        if len(hands_lm) == 1:
            cv2.rectangle(frame, (5, y_pos - 25), (495, y_pos + 180), (0, 100, 0), 2)
            cv2.putText(frame, "=== MODE ROTATION ===", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            y_pos += line_height
            
            lm = hands_lm[0]
            wrist = np.array([lm[0].x, lm[0].y], dtype=np.float32)
            
            # Afficher position du poignet
            cv2.putText(frame, f"Poignet: ({wrist[0]:.3f}, {wrist[1]:.3f})", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            y_pos += line_height - 5
            
            if prev_wrist is not None:
                delta = wrist - prev_wrist
                
                # Afficher delta brut
                cv2.putText(frame, f"Delta brut: dx={delta[0]:.5f}, dy={delta[1]:.5f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
                y_pos += line_height - 5
                
                # Appliquer deadzone
                delta_before = delta.copy()
                if abs(delta[0]) < config["ROT_DEADZONE"]: 
                    delta[0] = 0.0
                if abs(delta[1]) < config["ROT_DEADZONE"]: 
                    delta[1] = 0.0
                
                deadzone_active = not np.array_equal(delta, delta_before)
                deadzone_color = (0, 0, 255) if deadzone_active else (100, 100, 100)
                cv2.putText(frame, f"Deadzone active: {deadzone_active}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, deadzone_color, 1)
                y_pos += line_height - 5
                
                # Lissage
                rot_vel = config["SMOOTH"] * rot_vel + (1.0 - config["SMOOTH"]) * delta
                cv2.putText(frame, f"Velocite: vx={rot_vel[0]:.5f}, vy={rot_vel[1]:.5f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 255), 1)
                y_pos += line_height - 5
                
                # Calcul rotation finale
                rot_dx = float(-rot_vel[0] * config["ROT_GAIN"])
                rot_dy = float(rot_vel[1] * config["ROT_GAIN"])
                
                cv2.putText(frame, f"ROT_X: {rot_dx:.6f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                y_pos += line_height
                cv2.putText(frame, f"ROT_Y: {rot_dy:.6f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                y_pos += line_height
                
                # Indicateurs visuels
                if abs(rot_dx) > 0.001 or abs(rot_dy) > 0.001:
                    cv2.putText(frame, ">>> MOUVEMENT DETECTE <<<", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                else:
                    cv2.putText(frame, "Aucun mouvement", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)
            else:
                cv2.putText(frame, "Initialisation...", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1)
            
            prev_wrist = wrist
            y_pos += line_height + 20
            
        else:
            prev_wrist = None
            rot_vel *= 0.85
        
        # === ZOOM (2 mains) ===
        if len(hands_lm) >= 2:
            cv2.rectangle(frame, (5, y_pos - 25), (495, y_pos + 220), (0, 0, 100), 2)
            cv2.putText(frame, "=== MODE ZOOM ===", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            y_pos += line_height
            
            # Test pincement main 1
            pinch1, dist1 = is_pinching(hands_lm[0], config["PINCH_THRESHOLD"])
            color1 = (0, 255, 0) if pinch1 else (0, 0, 255)
            cv2.putText(frame, f"Main 1: {'PINCE' if pinch1 else 'OUVERTE'} (dist={dist1:.3f})", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color1, 2)
            y_pos += line_height - 5
            
            # Test pincement main 2
            pinch2, dist2 = is_pinching(hands_lm[1], config["PINCH_THRESHOLD"])
            color2 = (0, 255, 0) if pinch2 else (0, 0, 255)
            cv2.putText(frame, f"Main 2: {'PINCE' if pinch2 else 'OUVERTE'} (dist={dist2:.3f})", (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color2, 2)
            y_pos += line_height - 5
            
            if pinch1 and pinch2:
                cv2.putText(frame, "PINCEMENT ACTIF!", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                y_pos += line_height
                
                # Distance entre pincements
                pinch_pos1 = np.array([hands_lm[0][4].x, hands_lm[0][4].y], dtype=np.float32)
                pinch_pos2 = np.array([hands_lm[1][4].x, hands_lm[1][4].y], dtype=np.float32)
                dist = float(np.linalg.norm(pinch_pos2 - pinch_pos1))
                
                cv2.putText(frame, f"Distance mains: {dist:.4f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                y_pos += line_height - 5
                
                if moving_avg_dist is None:
                    moving_avg_dist = dist
                    cv2.putText(frame, "Initialisation distance...", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                else:
                    diff = dist - moving_avg_dist
                    cv2.putText(frame, f"Diff: {diff:.5f} (avg={moving_avg_dist:.4f})", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
                    y_pos += line_height - 5
                    
                    deadzone_active = abs(diff) > config["ZOOM_DEADZONE"]
                    deadzone_color = (0, 255, 0) if deadzone_active else (0, 0, 255)
                    cv2.putText(frame, f"Deadzone OK: {deadzone_active}", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, deadzone_color, 1)
                    y_pos += line_height - 5
                    
                    if deadzone_active:
                        moving_avg_dist = 0.9 * moving_avg_dist + 0.1 * dist
                        zoom_delta = -diff * config["ZOOM_GAIN"]
                        
                        direction = "ECARTER (zoom+)" if diff > 0 else "RAPPROCHER (zoom-)"
                        cv2.putText(frame, f"Direction: {direction}", (10, y_pos), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)
                        y_pos += line_height - 5
                        
                        cv2.putText(frame, f"ZOOM_DELTA: {zoom_delta:.6f}", (10, y_pos), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                        y_pos += line_height
                        
                        cv2.putText(frame, ">>> ZOOM DETECTE <<<", (10, y_pos), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            else:
                moving_avg_dist = None
                cv2.putText(frame, "Pincez les 2 mains pour zoomer", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 100, 100), 1)
        else:
            moving_avg_dist = None
        
        # Résumé en bas
        y_pos = h - 80
        cv2.rectangle(frame, (0, y_pos - 10), (w, h), (50, 50, 50), -1)
        
        summary_color = (0, 255, 0) if (abs(rot_dx) > 0.001 or abs(rot_dy) > 0.001 or abs(zoom_delta) > 0.001) else (100, 100, 100)
        cv2.putText(frame, f"ENVOI: ROT_X={rot_dx:.4f} | ROT_Y={rot_dy:.4f} | ZOOM={zoom_delta:.4f}", 
                   (10, y_pos + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, summary_color, 2)
        
        cv2.putText(frame, "Appuyez sur 'Q' pour quitter | 'S' pour snapshot", 
                   (10, y_pos + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Log
        log_entry = {
            "frame": frame_count,
            "timestamp": datetime.now().isoformat(),
            "hands": len(hands_lm),
            "rot_dx": rot_dx,
            "rot_dy": rot_dy,
            "zoom_delta": zoom_delta
        }
        log_data.append(log_entry)
        
        cv2.imshow("Calibration Holo-Control", frame)
        frame_count += 1
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('s'):
            filename = f"snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
            cv2.imwrite(filename, frame)
            print(f"📸 Snapshot sauvegardé: {filename}")

cap.release()
cv2.destroyAllWindows()

# Sauvegarder les logs
log_filename = f"calibration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(log_filename, 'w') as f:
    json.dump({
        "config": config,
        "total_frames": frame_count,
        "log": log_data[-100:]  # Garder les 100 dernières frames
    }, f, indent=2)

print(f"\n✅ Calibration terminée!")
print(f"📊 Log sauvegardé: {log_filename}")
print(f"🎬 {frame_count} frames analysées")

# Statistiques
non_zero = [log for log in log_data if abs(log["rot_dx"]) > 0.001 or abs(log["rot_dy"]) > 0.001 or abs(log["zoom_delta"]) > 0.001]
print(f"📈 Mouvements détectés: {len(non_zero)}/{frame_count} frames ({len(non_zero)/frame_count*100:.1f}%)")
