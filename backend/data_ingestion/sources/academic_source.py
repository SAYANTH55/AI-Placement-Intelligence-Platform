from .base_source import BaseSource

class AcademicSource(BaseSource):
    def process(self, data: dict) -> dict:
        """
        data: dict representing an academic transcript or API payload
        """
        return {
            "extracted_text": data.get("transcript_text", ""),
            "skills": data.get("inferred_skills", []),
            "metrics": {
                "cgpa": data.get("cgpa", None),
                "subjects": data.get("subjects", [])
            }
        }
