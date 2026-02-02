
import ollama

class LLMClient:
    def __init__(self, model_name="phi4-mini"):
        self.model_name = model_name

    def generate(self, prompt: str, system_prompt: str, stream: bool = False):
        try:
            response = ollama.chat(model=self.model_name, messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt},
            ], stream=stream)
            
            if stream:
                return response # Returns a generator
            return response['message']['content']
        except Exception as e:
            return f"Error connecting to Ollama: {str(e)}"

    def generate_from_messages(self, messages: list, stream: bool = False):
        try:
            return ollama.chat(model=self.model_name, messages=messages, stream=stream)
        except Exception as e:
            print(f"LLM Error: {e}")
            return []
