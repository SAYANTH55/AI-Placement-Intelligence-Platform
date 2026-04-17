# A comprehensive dictionary of technical skills categorization
# This acts as our "General Data" for hardcoded extraction

SKILLS_DICTIONARY = {
    "Frontend": [
        "React", "Angular", "Vue", "Next.js", "Tailwind CSS", "HTML5", "CSS3", 
        "JavaScript", "TypeScript", "Redux", "Framer Motion", "Sass", "Bootstrap",
        "Svelte", "Webpack", "Vite", "jQuery", "Responsive Design"
    ],
    "Backend": [
        "Python", "Node.js", "Express", "Django", "Flask", "FastAPI", "Java", 
        "Spring Boot", "Go", "Ruby on Rails", "PHP", "Laravel", "NestJS",
        "C#", ".NET", "ASP.NET", "Rust", "Scala", "Kotlin", "GraphQL", "gRPC"
    ],
    "Database": [
        "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", 
        "DynamoDB", "Cassandra", "Prisma", "Sequelize", "Mongoose",
        "Neo4j", "Elasticsearch", "InfluxDB", "MariaDB", "CouchDB"
    ],
    "AI/ML": [
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", 
        "PyTorch", "Scikit-Learn", "Pandas", "NumPy", "Keras", "OpenCV", "LLM", "Generative AI",
        "Hugging Face", "MLOps", "Feature Engineering", "Model Deployment",
        "Reinforcement Learning", "GANs", "Transformers", "BERT", "GPT"
    ],
    "Cloud/DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", 
        "CI/CD", "Linux", "Nginx", "Firebase", "Vercel", "Github Actions",
        "Ansible", "Prometheus", "Grafana", "Helm", "ArgoCD", "CloudFormation"
    ],
    "Security": [
        "Penetration Testing", "Network Security", "OWASP", "Cryptography",
        "Wireshark", "Nmap", "Burp Suite", "SIEM", "SOC", "Firewall",
        "Incident Response", "Vulnerability Assessment", "Ethical Hacking",
        "Compliance", "IAM", "Zero Trust"
    ],
    "Data Engineering": [
        "Apache Spark", "Hadoop", "Kafka", "Airflow", "ETL", "Data Warehousing",
        "Snowflake", "Databricks", "dbt", "Data Modeling", "Data Pipelines",
        "Apache Beam", "Redshift", "BigQuery"
    ],
    "Mobile": [
        "React Native", "Flutter", "Swift", "SwiftUI", "Kotlin", "Jetpack Compose",
        "Xcode", "Android Studio", "Ionic", "Capacitor", "Expo"
    ],
    "Design": [
        "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator",
        "Prototyping", "Wireframing", "User Research", "Design Systems",
        "Accessibility", "UI Design", "UX Design", "Interaction Design"
    ],
    "Testing/QA": [
        "Selenium", "Cypress", "Jest", "Mocha", "JUnit", "PyTest",
        "Playwright", "Appium", "Load Testing", "Manual Testing",
        "Automation Testing", "API Testing", "Performance Testing", "BDD", "TDD"
    ],
    "Blockchain": [
        "Solidity", "Ethereum", "Web3.js", "Smart Contracts", "DeFi",
        "NFT", "Hyperledger", "Truffle", "Hardhat", "IPFS"
    ],
    "Game Dev": [
        "Unity", "Unreal Engine", "C++", "C#", "Blender",
        "Game Design", "3D Modeling", "Shader Programming", "OpenGL", "DirectX"
    ],
    "Tools": [
        "Git", "Github", "Postman", "Figma", "Jira", "Slack", "Trello",
        "VS Code", "IntelliJ", "Confluence", "Notion", "Linear"
    ],
    "Concepts": [
        "REST API", "Microservices", "Unit Testing", "System Design", "Agile", 
        "Scrum", "OOP", "Functional Programming", "Data Structures", "Algorithms",
        "Design Patterns", "SOLID", "Clean Architecture", "Event-Driven Architecture",
        "Domain-Driven Design", "API Gateway", "Load Balancing", "Caching"
    ]
}

# Flattened list for quick searching
ALL_SKILLS = [skill.lower() for cat in SKILLS_DICTIONARY.values() for skill in cat]

# ── Comprehensive IT Role Requirements ──────────────────────────────
# Each role lists its essential/core skills. The matcher compares
# a candidate's extracted skills against these to calculate fit.

ROLE_REQUIREMENTS = {
    # ── Development Roles ──
    "Full Stack Developer": [
        "React", "Node.js", "SQL", "JavaScript", "HTML5", "CSS3", "REST API", "Git", "TypeScript"
    ],
    "Backend Developer": [
        "Python", "Java", "SQL", "PostgreSQL", "FastAPI", "Docker", "REST API", "Microservices"
    ],
    "Frontend Developer": [
        "React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML5", "CSS3", "Figma", "Redux", "Responsive Design"
    ],
    "Mobile App Developer": [
        "React Native", "Flutter", "TypeScript", "JavaScript", "REST API", "Git", "Android Studio", "Xcode"
    ],
    "Java Developer": [
        "Java", "Spring Boot", "SQL", "REST API", "Microservices", "JUnit", "Maven", "Docker"
    ],
    "Python Developer": [
        "Python", "Django", "Flask", "FastAPI", "SQL", "REST API", "Docker", "Git"
    ],
    
    # ── Data & AI Roles ──
    "Data Scientist": [
        "Python", "Machine Learning", "Pandas", "Scikit-Learn", "SQL", "NumPy", "Data Structures", "Statistics"
    ],
    "AI/ML Engineer": [
        "Python", "PyTorch", "TensorFlow", "NLP", "Machine Learning", "Deep Learning", "MLOps", "Docker"
    ],
    "Data Engineer": [
        "Python", "SQL", "Apache Spark", "Kafka", "Airflow", "ETL", "Docker", "AWS", "Data Warehousing"
    ],
    "Data Analyst": [
        "SQL", "Python", "Pandas", "Excel", "Tableau", "Power BI", "Data Visualization", "Statistics"
    ],
    "NLP Engineer": [
        "Python", "NLP", "Hugging Face", "Transformers", "BERT", "Deep Learning", "PyTorch", "Machine Learning"
    ],
    
    # ── Cloud & Infrastructure Roles ──
    "DevOps Engineer": [
        "AWS", "Docker", "Kubernetes", "Jenkins", "Linux", "Terraform", "CI/CD", "Ansible", "Prometheus"
    ],
    "Cloud Architect": [
        "AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Microservices", "System Design", "Networking", "Docker", "CI/CD"
    ],
    "Site Reliability Engineer": [
        "Linux", "Docker", "Kubernetes", "Prometheus", "Grafana", "CI/CD", "Python", "Terraform", "Incident Response"
    ],
    
    # ── Security Roles ──
    "Cyber Security Analyst": [
        "Network Security", "SIEM", "Firewall", "Vulnerability Assessment", "OWASP",
        "Incident Response", "Linux", "Wireshark", "Penetration Testing"
    ],
    "Security Engineer": [
        "Penetration Testing", "Ethical Hacking", "Cryptography", "OWASP", "Burp Suite",
        "Network Security", "Linux", "IAM", "Zero Trust", "Compliance"
    ],
    
    # ── Design Roles ──
    "UI/UX Designer": [
        "Figma", "Adobe XD", "Prototyping", "Wireframing", "User Research",
        "Design Systems", "HTML5", "CSS3", "Accessibility", "Interaction Design"
    ],
    
    # ── QA & Testing Roles ──
    "QA Engineer": [
        "Selenium", "Cypress", "Jest", "Manual Testing", "Automation Testing",
        "API Testing", "Performance Testing", "Git", "Jira", "BDD"
    ],
    "SDET (Test Automation)": [
        "Selenium", "Playwright", "Java", "Python", "CI/CD", "API Testing",
        "Docker", "Jest", "Automation Testing", "TDD"
    ],
    
    # ── Emerging Tech Roles ──
    "Blockchain Developer": [
        "Solidity", "Ethereum", "Web3.js", "Smart Contracts", "JavaScript",
        "Node.js", "Hardhat", "Git", "Cryptography"
    ],
    "Game Developer": [
        "Unity", "C#", "C++", "3D Modeling", "Game Design",
        "Blender", "Shader Programming", "Git", "OOP"
    ],
    
    # ── Management & Architecture ──
    "Solutions Architect": [
        "System Design", "AWS", "Microservices", "Docker", "Kubernetes",
        "API Gateway", "Load Balancing", "Event-Driven Architecture", "SQL", "Cloud Architecture"
    ],
    "Technical Lead": [
        "System Design", "Microservices", "Docker", "Git", "Agile", "Scrum",
        "REST API", "CI/CD", "Code Review", "Design Patterns"
    ],
}

# Salary ranges for each role
ROLE_SALARIES = {
    "Full Stack Developer": "$80k - $140k",
    "Backend Developer": "$90k - $150k",
    "Frontend Developer": "$75k - $130k",
    "Mobile App Developer": "$85k - $145k",
    "Java Developer": "$85k - $150k",
    "Python Developer": "$85k - $145k",
    "Data Scientist": "$100k - $180k",
    "AI/ML Engineer": "$110k - $200k+",
    "Data Engineer": "$100k - $170k",
    "Data Analyst": "$65k - $110k",
    "NLP Engineer": "$105k - $190k",
    "DevOps Engineer": "$95k - $160k",
    "Cloud Architect": "$130k - $200k+",
    "Site Reliability Engineer": "$110k - $180k",
    "Cyber Security Analyst": "$80k - $140k",
    "Security Engineer": "$100k - $170k",
    "UI/UX Designer": "$70k - $130k",
    "QA Engineer": "$65k - $120k",
    "SDET (Test Automation)": "$80k - $140k",
    "Blockchain Developer": "$100k - $180k",
    "Game Developer": "$70k - $140k",
    "Solutions Architect": "$130k - $210k+",
    "Technical Lead": "$120k - $190k",
}
