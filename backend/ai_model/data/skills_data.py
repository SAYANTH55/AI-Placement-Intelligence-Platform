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

# ── Role-to-Skill Matrix (Preparation & Practice Engine) ─────────────────────
# Subdivides role requirements into core / secondary / soft priority tiers.
# Core skills gate the role; secondary improve fit; soft are differentiators.

ROLE_SKILL_MATRIX = {
    "Software Engineer": {
        "core": ["Python", "Java", "C++", "Data Structures", "Algorithms", "OOP", "System Design", "Git"],
        "secondary": ["SQL", "REST API", "Docker", "Linux", "Design Patterns"],
        "soft": ["Problem Solving", "Teamwork", "Communication"]
    },
    "Backend Developer": {
        "core": ["Python", "Java", "Node.js", "SQL", "REST API", "Spring Boot", "PostgreSQL"],
        "secondary": ["Docker", "AWS", "Linux", "Redis", "CI/CD", "FastAPI"],
        "soft": ["Problem Solving", "Adaptability"]
    },
    "Frontend Developer": {
        "core": ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Redux"],
        "secondary": ["Tailwind CSS", "Figma", "Responsive Design", "Webpack", "Next.js"],
        "soft": ["Attention to Detail", "Communication"]
    },
    "Full Stack Developer": {
        "core": ["React", "Node.js", "JavaScript", "SQL", "REST API", "Git"],
        "secondary": ["TypeScript", "Docker", "MongoDB", "AWS", "CI/CD"],
        "soft": ["Problem Solving", "Teamwork"]
    },
    "Web Developer": {
        "core": ["HTML5", "CSS3", "JavaScript", "React", "REST API"],
        "secondary": ["TypeScript", "Node.js", "SQL", "Git", "Responsive Design"],
        "soft": ["Attention to Detail", "Communication"]
    },
    "Mobile App Developer": {
        "core": ["React Native", "Flutter", "JavaScript", "TypeScript", "REST API"],
        "secondary": ["Android Studio", "Xcode", "Git", "Firebase", "Kotlin"],
        "soft": ["Problem Solving", "Adaptability"]
    },
    "Data Analyst": {
        "core": ["SQL", "Python", "Pandas", "Excel", "Data Visualization"],
        "secondary": ["Tableau", "Power BI", "NumPy", "Statistics", "Spark"],
        "soft": ["Communication", "Attention to Detail"]
    },
    "Data Scientist": {
        "core": ["Python", "Machine Learning", "Pandas", "Scikit-Learn", "SQL", "NumPy"],
        "secondary": ["TensorFlow", "PyTorch", "Feature Engineering", "Statistics", "MLOps"],
        "soft": ["Problem Solving", "Communication"]
    },
    "Machine Learning Engineer": {
        "core": ["Python", "PyTorch", "TensorFlow", "Machine Learning", "Deep Learning", "MLOps"],
        "secondary": ["Docker", "Kubernetes", "Scikit-Learn", "Feature Engineering", "Model Deployment"],
        "soft": ["Research Mindset", "Problem Solving"]
    },
    "AI Engineer": {
        "core": ["Python", "LLM", "Generative AI", "PyTorch", "NLP", "Transformers"],
        "secondary": ["Hugging Face", "BERT", "GPT", "Docker", "REST API"],
        "soft": ["Research Mindset", "Adaptability"]
    },
    "Deep Learning Engineer": {
        "core": ["Python", "PyTorch", "TensorFlow", "Deep Learning", "Computer Vision", "NLP"],
        "secondary": ["CUDA", "Keras", "Docker", "MLOps", "GANs"],
        "soft": ["Problem Solving", "Research Mindset"]
    },
    "DevOps Engineer": {
        "core": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform"],
        "secondary": ["Jenkins", "Ansible", "Prometheus", "Grafana", "Helm"],
        "soft": ["Problem Solving", "Adaptability"]
    },
    "Cloud Engineer": {
        "core": ["AWS", "Azure", "GCP", "Terraform", "Docker", "Kubernetes"],
        "secondary": ["CI/CD", "Linux", "Ansible", "Networking", "Security"],
        "soft": ["Problem Solving", "Communication"]
    },
    "Site Reliability Engineer": {
        "core": ["Linux", "Docker", "Kubernetes", "Prometheus", "Python", "CI/CD"],
        "secondary": ["Grafana", "Terraform", "Incident Response", "Networking", "Automation Testing"],
        "soft": ["Problem Solving", "Adaptability"]
    },
    "Cybersecurity Analyst": {
        "core": ["Network Security", "SIEM", "Vulnerability Assessment", "Linux", "OWASP"],
        "secondary": ["Wireshark", "Penetration Testing", "Incident Response", "Firewall", "IAM"],
        "soft": ["Attention to Detail", "Problem Solving"]
    },
    "Network Engineer": {
        "core": ["Networking", "Linux", "Firewall", "Cisco", "TCP/IP"],
        "secondary": ["SIEM", "VPN", "DNS", "Load Balancing", "Security"],
        "soft": ["Problem Solving", "Communication"]
    },
    "QA Engineer": {
        "core": ["Selenium", "Manual Testing", "Automation Testing", "API Testing", "Jest"],
        "secondary": ["Cypress", "Playwright", "JUnit", "BDD", "Performance Testing"],
        "soft": ["Attention to Detail", "Communication"]
    },
    "Automation Tester": {
        "core": ["Selenium", "Playwright", "Python", "Java", "CI/CD"],
        "secondary": ["Cypress", "JUnit", "TDD", "Docker", "API Testing"],
        "soft": ["Attention to Detail", "Problem Solving"]
    },
    "Product Engineer": {
        "core": ["System Design", "REST API", "SQL", "Python", "Microservices"],
        "secondary": ["Docker", "Agile", "Scrum", "Product Management", "Git"],
        "soft": ["Communication", "Teamwork", "Problem Solving"]
    },
    "Java Developer": {
        "core": ["Java", "Spring Boot", "SQL", "REST API", "OOP"],
        "secondary": ["Microservices", "JUnit", "Docker", "Maven", "Design Patterns"],
        "soft": ["Problem Solving", "Teamwork"]
    },
    "Python Developer": {
        "core": ["Python", "Django", "Flask", "FastAPI", "SQL", "REST API"],
        "secondary": ["Docker", "Celery", "Redis", "PostgreSQL", "Git"],
        "soft": ["Problem Solving", "Adaptability"]
    },
    "Data Engineer": {
        "core": ["Python", "SQL", "Apache Spark", "Kafka", "ETL"],
        "secondary": ["Airflow", "Docker", "AWS", "Data Warehousing", "dbt"],
        "soft": ["Problem Solving", "Attention to Detail"]
    },
    "AI/ML Engineer": {
        "core": ["Python", "PyTorch", "TensorFlow", "Machine Learning", "Deep Learning", "MLOps"],
        "secondary": ["Docker", "Kubernetes", "Scikit-Learn", "Feature Engineering", "Model Deployment"],
        "soft": ["Research Mindset", "Problem Solving"]
    },
}

# ── Skill-to-Topics Drill-Down Map ───────────────────────────────────────────
# Maps each skill to its concrete sub-topics used in the Preparation Engine.
# The Practice Engine uses these topics to tag coding/interview questions.

SKILL_TOPICS = {
    # Programming Languages
    "Python": ["Syntax & Data Types", "OOP in Python", "File I/O", "Decorators & Generators", "Error Handling", "Virtual Environments"],
    "Java": ["Core Java", "OOP Principles", "Collections Framework", "Multithreading", "JVM Internals", "Maven/Gradle"],
    "JavaScript": ["ES6+ Features", "Async/Await & Promises", "Closures & Scope", "Prototype Chain", "Event Loop", "DOM Manipulation"],
    "TypeScript": ["Type System", "Interfaces & Generics", "Utility Types", "Type Guards", "Decorators", "tsconfig"],
    "C++": ["Pointers & Memory", "STL", "Templates", "RAII", "Move Semantics", "Compilation Model"],
    "Go": ["Goroutines", "Channels", "Interfaces", "Error Handling", "Packages", "Concurrency Patterns"],
    "C#": ["LINQ", ".NET Runtime", "Async/Await", "OOP", "Entity Framework", "Dependency Injection"],
    "SQL": ["SELECT & Joins", "Aggregations", "Subqueries", "Indexes & Performance", "Transactions", "Stored Procedures"],
    "Kotlin": ["Coroutines", "Data Classes", "Extension Functions", "Null Safety", "Collections", "Kotlin DSL"],

    # Web Frameworks
    "React": ["JSX & Virtual DOM", "Hooks (useState, useEffect)", "Context API", "Performance Optimization", "React Router", "Testing with Jest"],
    "Angular": ["Components & Modules", "Services & DI", "RxJS Observables", "Change Detection", "Forms", "Angular CLI"],
    "Node.js": ["Event Loop", "Streams & Buffers", "Express.js", "Middleware", "npm Ecosystem", "Cluster Module"],
    "Express": ["Routing", "Middleware", "Error Handling", "REST API Design", "Authentication", "Rate Limiting"],
    "Django": ["Models & ORM", "Views & Templates", "DRF", "Authentication", "Admin Panel", "Celery Integration"],
    "Flask": ["Routes & Views", "Blueprints", "SQLAlchemy", "Request Context", "API Design", "Deployment"],
    "FastAPI": ["Path Operations", "Pydantic Models", "Dependency Injection", "Background Tasks", "WebSockets", "Security"],
    "Spring Boot": ["Spring IoC", "REST Controllers", "JPA/Hibernate", "Security", "Actuator", "Microservices Patterns"],
    "Next.js": ["SSR vs SSG", "API Routes", "Middleware", "Image Optimization", "App Router", "Deployment on Vercel"],

    # AI/ML
    "Machine Learning": ["Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Feature Engineering", "Overfitting/Underfitting", "Cross-Validation"],
    "Deep Learning": ["Neural Networks", "Backpropagation", "CNNs", "RNNs & LSTMs", "Attention Mechanism", "Transfer Learning"],
    "TensorFlow": ["Tensors & Operations", "Keras API", "Model Training", "Callbacks", "TF Data Pipeline", "Model Deployment"],
    "PyTorch": ["Tensors & Autograd", "nn.Module", "DataLoader", "Training Loop", "GPU Acceleration", "TorchScript"],
    "Scikit-Learn": ["Preprocessing", "Classification Models", "Regression Models", "Clustering", "Model Selection", "Pipelines"],
    "Pandas": ["DataFrames", "Indexing & Slicing", "GroupBy", "Merging & Joining", "Time Series", "Data Cleaning"],
    "NumPy": ["Arrays & Broadcasting", "Linear Algebra", "Random Module", "Reshaping", "Vectorization", "Memory Layout"],
    "NLP": ["Tokenization", "POS Tagging", "Named Entity Recognition", "Embeddings (Word2Vec)", "Transformers", "Sentiment Analysis"],
    "MLOps": ["Model Versioning", "CI/CD for ML", "Model Monitoring", "Feature Stores", "Docker for ML", "MLflow"],

    # Cloud / DevOps
    "Docker": ["Images & Containers", "Dockerfile", "Docker Compose", "Container Networking", "Volume Management", "Registry & Push"],
    "Kubernetes": ["Pods & Deployments", "Services & Ingress", "ConfigMaps & Secrets", "HPA", "RBAC", "Helm Charts"],
    "AWS": ["EC2 & S3", "IAM & Security", "Lambda", "RDS", "VPC Networking", "CloudWatch"],
    "Azure": ["Resource Groups", "Azure AD", "App Services", "Azure Functions", "CosmosDB", "DevOps Pipelines"],
    "GCP": ["Compute Engine", "Cloud Run", "BigQuery", "GKE", "Cloud Storage", "IAM"],
    "Terraform": ["Providers & Resources", "State Management", "Modules", "Variables & Outputs", "Remote State", "Workspaces"],
    "CI/CD": ["Pipeline Design", "GitHub Actions", "Jenkins", "ArgoCD", "Testing in CI", "Deployment Strategies"],
    "Linux": ["File System", "Process Management", "Networking Commands", "Shell Scripting", "Permissions", "systemd"],

    # Databases
    "PostgreSQL": ["ACID Transactions", "Indexes", "JSONB", "Query Planning", "Partitioning", "Replication"],
    "MySQL": ["Schema Design", "Joins & Subqueries", "Indexes", "Stored Procedures", "Replication", "Partitioning"],
    "MongoDB": ["Documents & Collections", "CRUD", "Aggregation Pipeline", "Indexes", "Schema Design", "Sharding"],
    "Redis": ["Data Structures", "Pub/Sub", "TTL & Eviction", "Clustering", "Lua Scripts", "Persistence"],

    # CS Fundamentals
    "Data Structures": ["Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees & BST", "Graphs", "Heaps & Hash Maps"],
    "Algorithms": ["Sorting (Quick, Merge)", "Searching (Binary)", "Recursion & Backtracking", "Dynamic Programming", "Greedy", "Graph Algorithms (BFS/DFS)"],
    "OOP": ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "SOLID Principles", "Design Patterns"],
    "System Design": ["Load Balancing", "Caching Strategies", "Database Sharding", "CAP Theorem", "Microservices", "API Rate Limiting"],
    "Design Patterns": ["Creational (Singleton, Factory)", "Structural (Adapter, Decorator)", "Behavioral (Observer, Strategy)", "MVC/MVP", "Repository Pattern"],
    "REST API": ["HTTP Methods", "Status Codes", "Authentication (JWT/OAuth)", "Versioning", "Rate Limiting", "Documentation (Swagger)"],
    "Microservices": ["Service Discovery", "API Gateway", "Event-Driven", "Saga Pattern", "Circuit Breaker", "Distributed Tracing"],

    # Testing
    "Selenium": ["WebDriver Setup", "Locators", "Page Object Model", "Waits", "Assertions", "Test Reporting"],
    "Jest": ["Test Structure", "Mocking", "Async Testing", "Snapshot Testing", "Code Coverage", "React Testing Library"],
    "Cypress": ["Test Runner", "Selectors", "Intercept & Mock", "Custom Commands", "CI Integration", "Visual Regression"],

    # Soft Skills
    "Problem Solving": ["Breaking Down Problems", "Pseudocode Planning", "Edge Case Analysis", "Algorithmic Thinking", "Debug Strategies"],
    "Communication": ["Technical Writing", "Code Documentation", "Presenting to Stakeholders", "Active Listening", "Conciseness"],
    "Teamwork": ["Code Reviews", "Pair Programming", "Conflict Resolution", "Knowledge Sharing", "Agile Ceremonies"],
    "Adaptability": ["Learning New Tech", "Handling Ambiguity", "Quick Prototyping", "Pivoting Strategies"],
}
