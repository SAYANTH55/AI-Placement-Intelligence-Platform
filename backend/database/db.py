import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Resolve the database file path relative to THIS file (db.py),
# so it is always the same file no matter where uvicorn is launched from.
_HERE = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_DB_PATH = os.path.join(_HERE, "..", "ai_placement.db")
_DEFAULT_DB_URL = f"sqlite:///{os.path.normpath(_DEFAULT_DB_PATH)}"

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB_URL)

connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
