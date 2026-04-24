from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UserStateManager:
    def __init__(self, db_session=None):
        self.db = db_session

    def fetch_or_initialize_state(self, student_id: str) -> dict:
        """
        Retrieves continuous identity model for a student, returning historical 
        vectors and current vector state.
        This provides context for temporal progression.
        """
        # In full production this queries a document-mapped `user_states` table
        # We start with a baseline structure avoiding cold-crash
        return {
            "student_id": student_id,
            "current_vector": {},
            "historical_vectors": [], 
            "last_updated": datetime.utcnow().isoformat(),
            "state_version": 1
        }
    
    def update_state(self, student_id: str, new_vector: dict, current_state: dict) -> dict:
        """
        Pushes current_vector to history array and registers new_vector as the current state.
        """
        history = current_state.get("historical_vectors", [])
        old_vector = current_state.get("current_vector", {})
        
        if old_vector:
            history.append({
                "timestamp": current_state.get("last_updated"),
                "vector": old_vector
            })
            
        current_state["historical_vectors"] = history
        current_state["current_vector"] = new_vector
        current_state["state_version"] = current_state.get("state_version", 0) + 1
        current_state["last_updated"] = datetime.utcnow().isoformat()
        
        return current_state
