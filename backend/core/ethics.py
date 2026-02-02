
class EthicsGuard:
    def validate(self, content: str) -> bool:
        # Placeholder for real ethics constraints (e.g., keyword blocking)
        # In a real impl, this might check against a list of haram/unethical terms
        forbidden_terms = ["hack", "exploit", "unethical"]
        for term in forbidden_terms:
            if term in content.lower():
                return False
        return True

    def sanitize(self, content: str) -> str:
        # If validation fails, we could return a canned response or redacted content
        if not self.validate(content):
            return "Startup halted: Unethical or restricted content detected. Please realign your intention."
        return content
