"""
Migration: Add roll_number and first_login to users table.

Run from the backend directory:
    python scratch/migrate_provisioning.py

Safe to run multiple times — skips columns that already exist.
"""
import os
import sys
import sqlite3

# Resolve DB path the same way the app does
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from database.db import SQLALCHEMY_DATABASE_URL

# Extract file path from SQLite URL  e.g. "sqlite:///./ai_placement.db"
if "///" in SQLALCHEMY_DATABASE_URL:
    db_rel = SQLALCHEMY_DATABASE_URL.split("///", 1)[1]
    # Resolve relative to BASE_DIR (where the app is launched from)
    db_path = os.path.join(BASE_DIR, db_rel.lstrip("./"))
else:
    db_path = SQLALCHEMY_DATABASE_URL

print(f"[migration] Using database: {db_path}")

if not os.path.exists(db_path):
    print("[migration] Database file not found — no migration needed (tables will be created fresh by the app).")
    sys.exit(0)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch existing columns on the users table
cursor.execute("PRAGMA table_info(users)")
existing_cols = {row[1] for row in cursor.fetchall()}
print(f"[migration] Existing columns: {existing_cols}")

migrations_run = 0

# 1. roll_number — unique student roll number / temp password seed
if "roll_number" not in existing_cols:
    print("[migration] Adding column: roll_number (TEXT, nullable, unique)")
    cursor.execute("ALTER TABLE users ADD COLUMN roll_number TEXT DEFAULT NULL")
    # SQLite doesn't support ADD COLUMN UNIQUE inline, so we create the index separately
    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_roll_number ON users (roll_number) "
        "WHERE roll_number IS NOT NULL"
    )
    migrations_run += 1
else:
    print("[migration] Skipping roll_number — already exists")

# 2. first_login — forces password change on first login
if "first_login" not in existing_cols:
    print("[migration] Adding column: first_login (BOOLEAN, default 0)")
    cursor.execute("ALTER TABLE users ADD COLUMN first_login BOOLEAN DEFAULT 0")
    migrations_run += 1
else:
    print("[migration] Skipping first_login — already exists")

conn.commit()
conn.close()

if migrations_run:
    print(f"[migration] ✅ Done — {migrations_run} column(s) added successfully.")
else:
    print("[migration] ✅ Nothing to do — all columns already present.")
