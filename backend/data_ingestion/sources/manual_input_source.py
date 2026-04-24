from .base_source import BaseSource

class ManualInputSource(BaseSource):
    def process(self, data: dict) -> dict:
        """
        data: dict from a web form containing 'text', 'skills', 'experience'
        """
        return {
            "extracted_text": data.get("text", ""),
            "skills": data.get("skills", []),
            "experience": str(data.get("experience", "0")),
            "metrics": data.get("metrics", {})
        }
