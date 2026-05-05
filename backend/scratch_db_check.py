import sqlite3
import os

db_path = "backend/ai_placement.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- USERS ---")
cursor.execute("SELECT id, email, name FROM users;")
for row in cursor.fetchall():
    print(row)

print("\n--- USER PROGRESS ---")
cursor.execute("SELECT * FROM user_progress;")
for row in cursor.fetchall():
    print(row)

conn.close()
