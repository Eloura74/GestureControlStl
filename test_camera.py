"""
Test Caméra - Diagnostic Webcam
"""
import cv2

print("=" * 60)
print("TEST CAMÉRA - DIAGNOSTIC")
print("=" * 60)

# Test caméra index 0
print("\n[1/3] Test caméra index 0...")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
if cap.isOpened():
    ret, frame = cap.read()
    if ret:
        h, w = frame.shape[:2]
        print(f"✅ Caméra 0 OK - Résolution: {w}x{h}")
        print("   → Utilise 'index = 0' dans config.toml")
        cap.release()
    else:
        print("❌ Caméra 0 ouverte mais ne lit pas de frame")
        cap.release()
else:
    print("❌ Caméra 0 BLOQUÉE ou inexistante")
    cap.release()
    
    # Test caméra index 1
    print("\n[2/3] Test caméra index 1...")
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            h, w = frame.shape[:2]
            print(f"✅ Caméra 1 OK - Résolution: {w}x{h}")
            print("   → Édite config.toml: [camera] index = 1")
            cap.release()
        else:
            print("❌ Caméra 1 ouverte mais ne lit pas de frame")
            cap.release()
    else:
        print("❌ Caméra 1 BLOQUÉE ou inexistante")
        cap.release()
        
        # Test caméra index 2
        print("\n[3/3] Test caméra index 2...")
        cap = cv2.VideoCapture(2, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                h, w = frame.shape[:2]
                print(f"✅ Caméra 2 OK - Résolution: {w}x{h}")
                print("   → Édite config.toml: [camera] index = 2")
                cap.release()
            else:
                print("❌ Caméra 2 ouverte mais ne lit pas de frame")
                cap.release()
        else:
            print("❌ Caméra 2 BLOQUÉE ou inexistante")
            cap.release()

print("\n" + "=" * 60)
print("RÉSULTAT:")
print("=" * 60)
print("Si AUCUNE caméra ne fonctionne:")
print("  1. Ferme Skype, Teams, Zoom, Discord, OBS")
print("  2. Vérifie Paramètres Windows → Confidentialité → Caméra")
print("  3. Redémarre l'ordinateur si nécessaire")
print("=" * 60)
