from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
import ollama
from core.router import AmanRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AMAN-AI Orchestrator")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = AmanRouter()

@app.get("/api/models")
async def list_models():
    """List available Ollama models"""
    try:
        response = ollama.list()
        
        # Handle if response is object (ListResponse) or dict
        if hasattr(response, 'models'):
            models_list = response.models
        else:
            models_list = response.get('models', [])
            
        # Extract names (checking for 'model' attribute or key)
        model_names = []
        for m in models_list:
            if hasattr(m, 'model'):
                model_names.append(m.model)
            elif isinstance(m, dict):
                model_names.append(m.get('model') or m.get('name'))
                
        return {"models": model_names}
    except Exception as e:
        print(f"Error fetching models: {e}")
        return {"models": [], "error": str(e)}

class CommandRequest(BaseModel):
    command: str
    user_input: str
    session_id: str
    history: List[dict] = []
    model: str = "llama3.2:1.5b"  # Default model

from fastapi.responses import StreamingResponse

@app.post("/api/command")
async def process_command(request: CommandRequest):
    """
    Process a user command using the Orchestrator.
    Returns a streaming response containing the LLM output.
    """
    try:
        generator = await router.handle_request(
            request.command, 
            request.user_input, 
            request.session_id, 
            request.history,
            request.model
        )
        return StreamingResponse(generator, media_type="application/x-ndjson")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    # When running as a standalone executable/script
    uvicorn.run(app, host="127.0.0.1", port=8000)
