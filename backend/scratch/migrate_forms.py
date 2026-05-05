import sqlite3
import os

db_path = "e:\\Al-Placement-Intelligence-Platform\\backend\\ai_placement.db"

def migrate():
    if not os.path.exists(db_path):
        print("Database not found at", db_path)
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Adding application_form_fields to placement_drives...")
    try:
        cursor.execute("ALTER TABLE placement_drives ADD COLUMN application_form_fields JSON")
        print("Added application_form_fields column successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error or already exists: {e}")

    print("Adding form_responses to placement_applications...")
    try:
        cursor.execute("ALTER TABLE placement_applications ADD COLUMN form_responses JSON")
        print("Added form_responses column successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error or already exists: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
