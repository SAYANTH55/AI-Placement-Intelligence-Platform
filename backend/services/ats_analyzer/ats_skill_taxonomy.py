"""
ats_skill_taxonomy.py
---------------------
Role skill taxonomy for Engine 2 (Target Role Alignment).

Roles must match exactly what the XGBoost Role Predictor was trained on:
  Backend Developer | Business Analyst | Cybersecurity Analyst | Data Engineer |
  Data Scientist | DevOps Engineer | Frontend Developer | Full Stack Developer |
  ML Engineer | Mobile Developer

Each role has:
  core      — the 6-10 most critical skills (weighted 70%)
  secondary — supporting/complementary skills (weighted 30%)
"""

TAXONOMY = {
    "Backend Developer": {
        "core": ["Python", "Node.js", "Java", "REST API", "PostgreSQL", "SQL",
                 "Docker", "FastAPI", "Django", "Spring Boot"],
        "secondary": ["Redis", "Kafka", "MongoDB", "GraphQL", "Kubernetes",
                      "Microservices", "AWS", "Celery", "Go", "TypeScript"],
    },
    "Frontend Developer": {
        "core": ["React", "JavaScript", "TypeScript", "HTML", "CSS",
                 "Next.js", "Vue.js", "Angular", "Tailwind CSS", "Responsive Design"],
        "secondary": ["Redux", "Webpack", "Vite", "Framer Motion", "Storybook",
                      "Accessibility", "Performance Optimization", "Testing Library", "Jest"],
    },
    "Full Stack Developer": {
        "core": ["React", "Node.js", "JavaScript", "TypeScript", "PostgreSQL",
                 "REST API", "Docker", "Python", "MongoDB", "Next.js"],
        "secondary": ["AWS", "Redis", "GraphQL", "Prisma", "Tailwind CSS",
                      "Express", "Django", "FastAPI", "CI/CD"],
    },
    "Data Scientist": {
        "core": ["Python", "Machine Learning", "SQL", "Pandas", "Scikit-Learn",
                 "TensorFlow", "Statistics", "NumPy", "Deep Learning", "PyTorch"],
        "secondary": ["Tableau", "Power BI", "NLP", "Computer Vision", "XGBoost",
                      "R", "Spark", "Hypothesis Testing", "Feature Engineering", "Matplotlib"],
    },
    "ML Engineer": {
        "core": ["Python", "PyTorch", "TensorFlow", "MLOps", "Docker",
                 "Kubernetes", "Model Deployment", "AWS", "Machine Learning", "Hugging Face"],
        "secondary": ["MLflow", "Airflow", "Feature Store", "LLM", "Fine-Tuning",
                      "ONNX", "TensorRT", "Kafka", "Ray", "Sentence Transformers"],
    },
    "DevOps Engineer": {
        "core": ["Kubernetes", "Docker", "Terraform", "AWS", "CI/CD",
                 "Linux", "Bash", "Helm", "GitHub Actions", "Prometheus"],
        "secondary": ["Ansible", "Jenkins", "Grafana", "ArgoCD", "Azure",
                      "GCP", "Nginx", "Security", "Monitoring", "Python"],
    },
    "Data Engineer": {
        "core": ["Python", "Apache Spark", "SQL", "Airflow", "Kafka",
                 "AWS", "PostgreSQL", "dbt", "Data Warehouse", "ETL"],
        "secondary": ["Snowflake", "BigQuery", "Redshift", "Delta Lake", "Flink",
                      "PySpark", "Redis", "Docker", "Kubernetes", "Great Expectations"],
    },
    "Cybersecurity Analyst": {
        "core": ["Penetration Testing", "Network Security", "Linux", "SIEM",
                 "Incident Response", "Python", "Kali Linux", "Vulnerability Assessment", "Firewalls"],
        "secondary": ["Burp Suite", "Wireshark", "Metasploit", "OWASP",
                      "Threat Hunting", "MITRE ATT&CK", "Cloud Security", "Malware Analysis"],
    },
    "Business Analyst": {
        "core": ["Requirements Gathering", "SQL", "Excel", "Stakeholder Management",
                 "BPMN", "Agile", "User Stories", "Jira", "Power BI", "Tableau"],
        "secondary": ["Python", "Process Improvement", "Data Analysis", "JIRA",
                      "Confluence", "Figma", "Change Management", "UAT", "Gap Analysis"],
    },
    "Mobile Developer": {
        "core": ["Flutter", "React Native", "Swift", "Kotlin", "Dart",
                 "iOS", "Android", "Firebase", "REST API", "Xcode"],
        "secondary": ["Redux", "Riverpod", "Bloc", "Navigation", "Push Notifications",
                      "SQLite", "CI/CD", "Fastlane", "App Store", "Play Store"],
    },
}
