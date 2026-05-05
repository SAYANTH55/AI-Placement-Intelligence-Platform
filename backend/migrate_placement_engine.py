"""
Migration script for Placement Engine tables.
Adds new columns to existing tables and creates new tables.
Safe to run multiple times — checks before adding.

Usage: python migrate_placement_engine.py
"""
import sqlite3
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "ai_placement.db")


def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def table_exists(cursor, table):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None


def migrate():
    print(f"[MIGRATE] Using database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # ── 1. Create new tables ──
    if not table_exists(c, "departments"):
        c.execute("""
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                level TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[MIGRATE] Created table: departments")

    if not table_exists(c, "companies"):
        c.execute("""
            CREATE TABLE companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                initials TEXT,
                website TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[MIGRATE] Created table: companies")

    if not table_exists(c, "placement_updates"):
        c.execute("""
            CREATE TABLE placement_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                update_type TEXT DEFAULT 'announcement',
                title TEXT NOT NULL,
                description TEXT,
                course TEXT DEFAULT 'ALL',
                action_label TEXT,
                action_url TEXT,
                posted_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("[MIGRATE] Created table: placement_updates")

    # ── 2. Add columns to users table ──
    if not column_exists(c, "users", "role"):
        c.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'")
        print("[MIGRATE] Added column: users.role")

    if not column_exists(c, "users", "course"):
        c.execute("ALTER TABLE users ADD COLUMN course TEXT")
        print("[MIGRATE] Added column: users.course")

    if not column_exists(c, "users", "department_id"):
        c.execute("ALTER TABLE users ADD COLUMN department_id INTEGER REFERENCES departments(id)")
        print("[MIGRATE] Added column: users.department_id")

    # ── 3. Add columns to placement_drives table ──
    if table_exists(c, "placement_drives"):
        if not column_exists(c, "placement_drives", "company_id"):
            c.execute("ALTER TABLE placement_drives ADD COLUMN company_id INTEGER REFERENCES companies(id)")
            print("[MIGRATE] Added column: placement_drives.company_id")

        if not column_exists(c, "placement_drives", "job_description"):
            c.execute("ALTER TABLE placement_drives ADD COLUMN job_description TEXT")
            print("[MIGRATE] Added column: placement_drives.job_description")

        if not column_exists(c, "placement_drives", "ctc"):
            c.execute("ALTER TABLE placement_drives ADD COLUMN ctc TEXT")
            print("[MIGRATE] Added column: placement_drives.ctc")

        if not column_exists(c, "placement_drives", "course"):
            c.execute("ALTER TABLE placement_drives ADD COLUMN course TEXT DEFAULT 'ALL'")
            print("[MIGRATE] Added column: placement_drives.course")

        if not column_exists(c, "placement_drives", "department_id"):
            c.execute("ALTER TABLE placement_drives ADD COLUMN department_id INTEGER REFERENCES departments(id)")
            print("[MIGRATE] Added column: placement_drives.department_id")

    # ── 4. Add columns to placement_applications table ──
    if table_exists(c, "placement_applications"):
        if not column_exists(c, "placement_applications", "ai_match_score"):
            c.execute("ALTER TABLE placement_applications ADD COLUMN ai_match_score REAL")
            print("[MIGRATE] Added column: placement_applications.ai_match_score")

    conn.commit()
    conn.close()
    print("[MIGRATE] Migration completed successfully!")


if __name__ == "__main__":
    migrate()
