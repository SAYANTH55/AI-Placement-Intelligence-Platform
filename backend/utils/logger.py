import logging
import os
import sys
from logging.handlers import RotatingFileHandler

def setup_logger(name: str):
    """
    Sets up a production-ready logger with both console and file handlers.
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if setup multiple times
    if logger.hasHandlers():
        return logger
        
    logger.setLevel(logging.INFO)
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )
    
    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File Handler (Rotating)
    file_handler = RotatingFileHandler(
        os.path.join(log_dir, "platform.log"),
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger

# Default platform logger
platform_logger = setup_logger("AI_Placement_Platform")
