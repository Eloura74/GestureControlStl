# Script de test pour voir les valeurs des gestes en temps réel
import cv2
import mediapipe as mp
import numpy as np

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

prev_wrist = None
rot_vel = np.array([0.0, 0.0], dtype=np.float32)
moving_avg_dist = None

ROT_GAIN = 0.015
ZOOM_GAIN = 0.008
SMOOTH = 0.6
ROT_DEADZONE = 0.002
ZOOM_DEADZONE = 0.01

def is_pinching(landmarks, threshold=0.08):
    thumb = np.array([landmarks[4].x, landmarks[4].y])
    index = np.array([landmarks[8].x, landmarks[8].y])
    distance = np.linalg.norm(thumb - index)
    return distance < threshold

print("=== TEST DES GESTES ===")
print("1 main = ROTATION | 2 mains en pincement = ZOOM")
print("Appuyez sur 'q' pour quitter")
print()

with mp_hands.Hands(
    max_num_hands=2,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6,
    model_complexity=1
) as hands:
    
    while True:
        ok, frame = cap.read()
        if not ok:
            break
            
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = hands.process(rgb)
        
        rot_dx = rot_dy = 0.0
        zoom_delta = 0.0
        
        hands_lm = []
        if res.multi_hand_landmarks:
            for hlm in res.multi_hand_landmarks:
                mp_drawing.draw_landmarks(frame, hlm, mp_hands.HAND_CONNECTIONS)
                hands_lm.append(hlm.landmark)
        
        # ROTATION
        if len(hands_lm) == 1:
            lm = hands_lm[0]
            wrist = np.array([lm[0].x, lm[0].y], dtype=np.float32)
            if prev_wrist is not None:
                delta = wrist - prev_wrist
                if abs(delta[0]) < ROT_DEADZONE: delta[0] = 0.0
                if abs(delta[1]) < ROT_DEADZONE: delta[1] = 0.0
                rot_vel = SMOOTH * rot_vel + (1.0 - SMOOTH) * delta
                rot_dx = float(-rot_vel[0] * ROT_GAIN)
                rot_dy = float(rot_vel[1] * ROT_GAIN)
            prev_wrist = wrist
            
            cv2.putText(frame, f"ROTATION MODE", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"ROT_X: {rot_dx:.4f}", (10, 70), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, f"ROT_Y: {rot_dy:.4f}", (10, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        else:
            prev_wrist = None
            rot_vel *= 0.85
        
        # ZOOM
        if len(hands_lm) >= 2:
            hand1_pinching = is_pinching(hands_lm[0])
            hand2_pinching = is_pinching(hands_lm[1])
            
            pinch_text = f"Hand1: {'PINCH' if hand1_pinching else 'OPEN'} | Hand2: {'PINCH' if hand2_pinching else 'OPEN'}"
            cv2.putText(frame, pinch_text, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            
            if hand1_pinching and hand2_pinching:
                pinch1 = np.array([hands_lm[0][4].x, hands_lm[0][4].y], dtype=np.float32)
                pinch2 = np.array([hands_lm[1][4].x, hands_lm[1][4].y], dtype=np.float32)
                dist = float(np.linalg.norm(pinch2 - pinch1))
                
                if moving_avg_dist is None:
                    moving_avg_dist = dist
                diff = dist - moving_avg_dist
                
                if abs(diff) > ZOOM_DEADZONE:
                    moving_avg_dist = 0.9 * moving_avg_dist + 0.1 * dist
                    zoom_delta = -diff * ZOOM_GAIN
                
                cv2.putText(frame, f"ZOOM MODE ACTIVE", (10, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, f"Distance: {dist:.3f}", (10, 110), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f"ZOOM: {zoom_delta:.4f}", (10, 140), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                direction = "ECARTER = ZOOM+" if diff > 0 else "RAPPROCHER = ZOOM-" if diff < 0 else "STABLE"
                cv2.putText(frame, direction, (10, 170), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            else:
                moving_avg_dist = None
        
        # Affichage nombre de mains
        cv2.putText(frame, f"Mains detectees: {len(hands_lm)}", (10, frame.shape[0] - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        cv2.imshow("Test Gestes - Appuyez sur Q pour quitter", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
print("\nTest terminé!")
