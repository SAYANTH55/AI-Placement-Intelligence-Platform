import os
import sqlite3
import json

db_path = os.path.join(os.path.dirname(__file__), "..", "ai_placement.db")

queries = {
    "Student Dashboard (Student lookup by roll number)": "SELECT * FROM placement_students s JOIN users u ON s.user_id = u.id WHERE u.roll_number = '12345'",
    "Resume Analysis (Fetch normalized skills for an analysis)": "SELECT * FROM resume_skills WHERE analysis_id = 1",
    "Drive Listings (Fetch active drives)": "SELECT * FROM placement_drives WHERE status = 'open'",
    "Applications (Fetch applications for a student)": "SELECT * FROM placement_applications WHERE student_id = 1 AND status = 'Applied'",
    "Placement Analytics (Fetch outcomes for a drive)": "SELECT * FROM placement_outcomes WHERE drive_id = 1 AND got_placed = 1",
    "Skill Search (Find students with a specific skill)": "SELECT student_id FROM student_skills ss JOIN skills s ON ss.skill_id = s.id WHERE s.skill_name = 'python'",
    "Domain Search (Find analyses by domain)": "SELECT * FROM resume_domain_predictions WHERE primary_domain = 'engineering'"
}

def explain_queries():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    report_content = "# Query Plan Report\n\nThis document shows the output of `EXPLAIN QUERY PLAN` for the major system queries.\n\n"
    recommendations_content = "# Index Recommendations\n\nBased on the `EXPLAIN QUERY PLAN` outputs, here are the recommendations for index creation to optimize performance.\n\n"
    
    for name, query in queries.items():
        report_content += f"## {name}\n**Query:** `{query}`\n\n```text\n"
        try:
            cursor.execute(f"EXPLAIN QUERY PLAN {query}")
            plan = cursor.fetchall()
            for row in plan:
                # SQLite EXPLAIN QUERY PLAN format: id, parent, notused, detail
                report_content += f"{row[3]}\n"
        except Exception as e:
            report_content += f"Error: {e}\n"
            
        report_content += "```\n\n"

    recommendations_content += "### Recommendations\n"
    recommendations_content += "- `CREATE INDEX idx_users_roll_number ON users(roll_number);` (For Student Dashboard lookups)\n"
    recommendations_content += "- `CREATE INDEX idx_resume_skills_analysis_id ON resume_skills(analysis_id);` (For Resume Analysis page)\n"
    recommendations_content += "- `CREATE INDEX idx_placement_drives_status ON placement_drives(status);` (For Drive Listings)\n"
    recommendations_content += "- `CREATE INDEX idx_placement_applications_student_status ON placement_applications(student_id, status);` (For Application Tracking)\n"
    recommendations_content += "- `CREATE INDEX idx_placement_outcomes_drive_placed ON placement_outcomes(drive_id, got_placed);` (For Analytics)\n"
    recommendations_content += "- `CREATE INDEX idx_resume_domain_primary ON resume_domain_predictions(primary_domain);` (For Domain Search)\n"
    
    conn.close()

    report_path = os.path.join(os.path.dirname(__file__), "..", "..", "query_plan_report.md")
    rec_path = os.path.join(os.path.dirname(__file__), "..", "..", "index_recommendations.md")
    
    with open(report_path, "w") as f:
        f.write(report_content)
        
    with open(rec_path, "w") as f:
        f.write(recommendations_content)
        
    print(f"Generated {report_path} and {rec_path}")

if __name__ == "__main__":
    explain_queries()
