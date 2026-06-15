import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_PATH = "ai_placement.db"

def migrate():
    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found at {DB_PATH}")
        return

    logger.info(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(resume_analyses)")
        columns = [info[1] for info in cursor.fetchall()]

        if "is_resume" not in columns:
            logger.info("Adding 'is_resume' column to resume_analyses...")
            cursor.execute("ALTER TABLE resume_analyses ADD COLUMN is_resume BOOLEAN DEFAULT 1")
            
        if "document_type" not in columns:
            logger.info("Adding 'document_type' column to resume_analyses...")
            cursor.execute("ALTER TABLE resume_analyses ADD COLUMN document_type VARCHAR(50)")
            
        if "validation_confidence" not in columns:
            logger.info("Adding 'validation_confidence' column to resume_analyses...")
            cursor.execute("ALTER TABLE resume_analyses ADD COLUMN validation_confidence FLOAT")
            
        if "validation_reason" not in columns:
            logger.info("Adding 'validation_reason' column to resume_analyses...")
            cursor.execute("ALTER TABLE resume_analyses ADD COLUMN validation_reason TEXT")

        conn.commit()
        logger.info("Migration completed successfully!")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
