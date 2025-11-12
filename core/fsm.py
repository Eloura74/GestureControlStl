"""
Machine à États (FSM) pour gestion robuste des gestes
Évite les faux déclenchements et transitions brutales
"""

from enum import Enum, auto
import time


class GestureMode(Enum):
    """États possibles du système de gestes"""
    IDLE = auto()      # Aucun geste actif
    ROTATE = auto()    # Rotation du modèle (1 main)
    ZOOM = auto()      # Zoom (2 mains en pincement)
    EXPLODE = auto()   # Explosion du modèle (index levé)
    FREEZE = auto()    # Gel temporaire (poing fermé)


class GestureFSM:
    """
    Machine à États Finie pour gestion des transitions de gestes
    
    Priorités (du plus haut au plus bas):
    1. FREEZE (poing fermé - bloque tout)
    2. ZOOM (2 mains en pincement)
    3. ROTATE (1 main)
    4. EXPLODE (index levé)
    5. IDLE (aucun geste)
    
    Hystérésis temporel : un geste doit être maintenu un certain temps
    avant de déclencher la transition (évite les faux positifs)
    """
    
    def __init__(self, dwell_ms=None):
        """
        Args:
            dwell_ms: Dict des temps de maintien par mode (ms)
                      Si None, utilise les valeurs par défaut
        """
        self.mode = GestureMode.IDLE
        self.time_entered = time.time()
        self.previous_mode = GestureMode.IDLE
        
        # Temps de maintien requis avant transition (en ms)
        self.dwell_times = dwell_ms or {
            GestureMode.ROTATE: 80,
            GestureMode.ZOOM: 80,
            GestureMode.EXPLODE: 100,
            GestureMode.IDLE: 120,
            GestureMode.FREEZE: 0  # Freeze immédiat
        }
        
        # Statistiques
        self.transitions = 0
        self.mode_durations = {mode: 0.0 for mode in GestureMode}
        
    def _enter_mode(self, new_mode):
        """Change de mode (usage interne)"""
        if new_mode != self.mode:
            # Stats
            duration = time.time() - self.time_entered
            self.mode_durations[self.mode] += duration
            self.transitions += 1
            
            # Transition
            self.previous_mode = self.mode
            self.mode = new_mode
            self.time_entered = time.time()
            
            return True  # Transition effectuée
        return False  # Pas de changement
    
    def _time_in_current_mode(self):
        """Retourne le temps passé dans le mode actuel (en ms)"""
        return (time.time() - self.time_entered) * 1000
    
    def _can_transition(self, target_mode):
        """
        Vérifie si on peut transitionner vers un nouveau mode
        (en fonction du temps de maintien requis)
        """
        if target_mode == self.mode:
            return True  # Déjà dans ce mode
        
        # Freeze est immédiat
        if target_mode == GestureMode.FREEZE:
            return True
            
        # Pour les autres, vérifier le temps de maintien
        dwell_required = self.dwell_times.get(target_mode, 0)
        return self._time_in_current_mode() >= dwell_required
    
    def update(self, hands_detected, is_fist, is_pinch_left, is_pinch_right, 
               is_index_up, force_idle=False):
        """
        Met à jour la FSM selon les gestes détectés
        
        Args:
            hands_detected: Nombre de mains détectées (0, 1, 2)
            is_fist: True si poing fermé détecté
            is_pinch_left: True si main gauche en pincement
            is_pinch_right: True si main droite en pincement
            is_index_up: True si index levé
            force_idle: Force le retour en IDLE (pour reset)
            
        Returns:
            GestureMode actuel (après mise à jour)
        """
        if force_idle:
            self._enter_mode(GestureMode.IDLE)
            return self.mode
        
        # Priorité 1 : FREEZE (bloque tout)
        if is_fist:
            if self._can_transition(GestureMode.FREEZE):
                self._enter_mode(GestureMode.FREEZE)
            return self.mode
        
        # Priorité 2 : ZOOM (2 mains en pincement)
        if hands_detected >= 2 and is_pinch_left and is_pinch_right:
            if self._can_transition(GestureMode.ZOOM):
                self._enter_mode(GestureMode.ZOOM)
            return self.mode
        
        # Priorité 3 : ROTATE (1 main)
        if hands_detected == 1:
            if self._can_transition(GestureMode.ROTATE):
                self._enter_mode(GestureMode.ROTATE)
            return self.mode
        
        # Priorité 4 : EXPLODE (index levé)
        if is_index_up:
            if self._can_transition(GestureMode.EXPLODE):
                self._enter_mode(GestureMode.EXPLODE)
            return self.mode
        
        # Par défaut : retour IDLE après temps de maintien
        if self._can_transition(GestureMode.IDLE):
            self._enter_mode(GestureMode.IDLE)
        
        return self.mode
    
    def is_active(self, mode):
        """Vérifie si un mode spécifique est actif"""
        return self.mode == mode
    
    def can_apply_gesture(self, gesture_type):
        """
        Vérifie si un type de geste peut être appliqué dans l'état actuel
        
        Args:
            gesture_type: "rotation", "zoom", "explode"
            
        Returns:
            True si le geste peut être appliqué
        """
        if self.mode == GestureMode.FREEZE:
            return False  # Freeze bloque tout
            
        mapping = {
            "rotation": GestureMode.ROTATE,
            "zoom": GestureMode.ZOOM,
            "explode": GestureMode.EXPLODE
        }
        
        target_mode = mapping.get(gesture_type)
        return target_mode and self.mode == target_mode
    
    def reset(self):
        """Réinitialise la FSM"""
        self._enter_mode(GestureMode.IDLE)
        self.transitions = 0
        self.mode_durations = {mode: 0.0 for mode in GestureMode}
    
    def get_stats(self):
        """Retourne les statistiques d'utilisation"""
        total_time = sum(self.mode_durations.values())
        return {
            "current_mode": self.mode.name,
            "time_in_current_ms": self._time_in_current_mode(),
            "total_transitions": self.transitions,
            "mode_percentages": {
                mode.name: (duration / total_time * 100 if total_time > 0 else 0)
                for mode, duration in self.mode_durations.items()
            }
        }
    
    def __repr__(self):
        return f"<GestureFSM mode={self.mode.name} time={self._time_in_current_mode():.0f}ms>"


# Test unitaire
if __name__ == "__main__":
    print("🧪 Test de la Machine à États (FSM)")
    print("=" * 60)
    
    fsm = GestureFSM()
    
    # Scénario de test
    scenarios = [
        # (hands, fist, pinchL, pinchR, index_up, description)
        (0, False, False, False, False, "Aucune main"),
        (1, False, False, False, False, "1 main (rotation attendue)"),
        (1, False, False, False, True, "1 main + index levé"),
        (2, False, True, True, False, "2 mains en pincement (zoom)"),
        (2, True, False, False, False, "Poing fermé (freeze)"),
        (0, False, False, False, False, "Retour idle"),
    ]
    
    print("\n📊 Simulation de gestes:\n")
    
    for i, (hands, fist, pL, pR, idx, desc) in enumerate(scenarios, 1):
        time.sleep(0.1)  # Simule le passage du temps
        mode = fsm.update(hands, fist, pL, pR, idx)
        print(f"{i}. {desc:30s} → Mode: {mode.name:10s} ({fsm._time_in_current_mode():.0f}ms)")
    
    print(f"\n📈 Statistiques:")
    stats = fsm.get_stats()
    print(f"  Transitions totales: {stats['total_transitions']}")
    print(f"  Mode actuel: {stats['current_mode']}")
    print(f"\n  Répartition du temps:")
    for mode, pct in stats['mode_percentages'].items():
        if pct > 0:
            print(f"    {mode:10s}: {pct:5.1f}%")
    
    print("\n✅ Test terminé !")
