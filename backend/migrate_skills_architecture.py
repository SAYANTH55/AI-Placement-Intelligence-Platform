import logging
from database.db import engine, Base
# Import models to ensure they are registered with Base.metadata
import database.models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    logger.info("Creating new normalized tables for the skill architecture migration...")
    try:
        # create_all safely creates new tables without touching existing ones
        Base.metadata.create_all(bind=engine)
        logger.info("Migration completed successfully! New tables have been created.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
