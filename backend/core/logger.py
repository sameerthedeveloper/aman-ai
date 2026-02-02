import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any

LOG_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "aman.jsonl")

class AmanLogger:
    def __init__(self):
        # Ensure log directory exists
        os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)

    def log_entry(self, 
                  session_id: str, 
                  user_input: str, 
                  ai_output: str, 
                  mode: str, 
                  model: str = "mistral-7b",
                  tags: List[str] = None):
        
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "session_id": session_id,
            "mode": mode,
            "user_input": user_input,
            "ai_output": ai_output, # Full output text
            "model": model,
            "tags": tags or []
        }

        try:
            with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception as e:
            print(f"[ERROR] Failed to write log: {e}")

    def get_recent_context(self, session_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves the last `limit` entries for a given session.
        This provides the 'Context Window' for the AI.
        """
        session_entries = []
        try:
            if not os.path.exists(LOG_FILE_PATH):
                return []
                
            with open(LOG_FILE_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get("session_id") == session_id:
                            session_entries.append(entry)
                    except json.JSONDecodeError:
                        continue
                        
            # Return last `limit` entries
            return session_entries[-limit:]
        except Exception as e:
            print(f"[ERROR] Failed to read logs: {e}")
            return []
