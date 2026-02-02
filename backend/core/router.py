
from .prompts import ALIGN_SYSTEM_PROMPT, MODEL_SYSTEM_PROMPT, ACT_SYSTEM_PROMPT, NAVIGATE_SYSTEM_PROMPT
from .llm_client import LLMClient
from .ethics import EthicsGuard

class AmanRouter:
    def __init__(self):
        self.llm = LLMClient()
        self.ethics = EthicsGuard()
        self.current_mode = "ALIGN" # Default start mode

    async def handle_request(self, command: str, user_input: str, session_id: str, history: list, model: str = "llama3"):
        """
        Main entry point for handling user commands.
        """
        from .logger import AmanLogger
        logger = AmanLogger()

        # 1. Determine Mode
        if command == "/align":
            self.current_mode = "ALIGN"
            system_prompt = self.get_system_prompt("ALIGN")
        elif command == "/model":
            self.current_mode = "MODEL"
            system_prompt = self.get_system_prompt("MODEL")
        else:
            self.current_mode = "ALIGN" # Default
            system_prompt = self.get_system_prompt("ALIGN")
            
        # 2. Build Context (Strictly from Logs + Current Input)
        # We ignore the frontend 'history' payload for context building to enforce discipline,
        # but we might use it for session initialization if needed. 
        # For now, we trust the backend logs.
        
        context_messages = [{'role': 'system', 'content': system_prompt}]
        
        if session_id:
            recent_logs = logger.get_recent_context(session_id, limit=4)
            for log in recent_logs:
                context_messages.append({'role': 'user', 'content': log['user_input']})
                context_messages.append({'role': 'assistant', 'content': log['ai_output']})
        
        # Append current user input
        context_messages.append({'role': 'user', 'content': user_input})

        # 3. Stream Generator
        async def stream_generator():
            import json
            from duckduckgo_search import DDGS
            import re
            
            yield json.dumps({"mode": self.current_mode, "type": "meta"}) + "\n"

            # Use local reference for messages to allow modification (search injection)
            current_messages = list(context_messages)
            
            max_hops = 2
            final_response_content = ""
            
            for _ in range(max_hops):
                full_response = ""
                stream = self.llm.generate_from_messages(current_messages, stream=True)
                
                for chunk in stream:
                    content = chunk['message']['content']
                    full_response += content
                    final_response_content += content # Accumulate for logging
                    yield json.dumps({"content": content, "type": "chunk"}) + "\n"
                
                # Search Logic
                search_match = re.search(r'\[SEARCH\]\s*(.+)', full_response)
                if search_match:
                    query = search_match.group(1).strip()
                    yield json.dumps({"content": f"\n\n[SYSTEM: Searching web for '{query}'...]\n\n", "type": "chunk"}) + "\n"
                    
                    try:
                        results = DDGS().text(query, max_results=3)
                        search_context = f"\n[SEARCH_RESULTS]\n{str(results)}\n[INSTRUCTION]\nUse these results to refine the text. Do not ask questions."
                        
                        current_messages.append({'role': 'assistant', 'content': full_response})
                        current_messages.append({'role': 'user', 'content': search_context})
                        
                        # Reset final response accumulation for the next hop (refined answer)
                        final_response_content = "" 
                        continue 
                    except Exception as e:
                        yield json.dumps({"content": f"\n[SYSTEM: Search failed: {str(e)}]\n", "type": "chunk"}) + "\n"
                        break
                else:
                    break

            if not self.ethics.validate(final_response_content):
                yield json.dumps({"content": "\n[SYSTEM: Ethic Check Warning]", "type": "chunk"}) + "\n"
            
            # 4. Log the Interaction
            if session_id:
                logger.log_entry(
                    session_id=session_id,
                    user_input=user_input,
                    ai_output=final_response_content,
                    mode=self.current_mode
                )

        return stream_generator()

    def get_system_prompt(self, mode):
        from datetime import datetime
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        base_prompt = ""
        
        if mode == "ALIGN": base_prompt = ALIGN_SYSTEM_PROMPT
        elif mode == "MODEL": base_prompt = MODEL_SYSTEM_PROMPT
        elif mode == "ACT": base_prompt = ACT_SYSTEM_PROMPT
        elif mode == "NAVIGATE": base_prompt = NAVIGATE_SYSTEM_PROMPT
        
        return f"{base_prompt}\n\n[SYSTEM CONTEXT]\nCurrent Date: {current_date_str}\nIf the user asks for 'latest' or 'current' info, you MUST use [SEARCH]."
