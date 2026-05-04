from .base_source import BaseSource
from ai_model.resume_parser.parser import parse_resume
import logging

logger = logging.getLogger(__name__)

class ResumeSource(BaseSource):
    def process(self, data: str) -> dict:
        """
        data: str (file_path to the resume)
        """
        logger.info(f"Processing resume source from path: {data}")
        try:
            parsed_data = parse_resume(data)
            return parsed_data
        except Exception as e:
            logger.error(f"Error parsing resume: {str(e)}")
            # Return partial/empty struct to not crash pipeline
            return {"skills": [], "experience": "0", "extracted_text": ""}
