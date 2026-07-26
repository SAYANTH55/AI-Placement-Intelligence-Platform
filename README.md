<div align="center">
  <h1>JobMode 🚀</h1>
  <p><b>The AI-Driven Candidate Intelligence & Placement Management Platform</b></p>

  <p>
    JobMode is an enterprise-grade platform that connects students, universities, and companies through a unified intelligence layer. By leveraging advanced Machine Learning, Natural Language Processing, and LLMs, JobMode provides unparalleled resume analysis, ATS benchmarking, and placement probability scoring.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#installation">Installation</a> •
    <a href="#documentation">Documentation</a>
  </p>
</div>

---

## 🛡 Badges

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)
![React Version](https://img.shields.io/badge/react-19.x-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Maintained](https://img.shields.io/badge/maintained-yes-brightgreen.svg)

---

## ✨ Features

JobMode is designed to bridge the gap between academic preparation and real-world placement success. 

### 🎓 Student Platform
- **Intelligent Dashboard**: Real-time insights into placement readiness and profile strength.
- **Resume Upload & Parsing**: Deep entity extraction from resumes.
- **Skill Gap Analysis**: Actionable feedback to improve employability.

### 🏢 Placement Platform
- **Drive Management**: End-to-end management of recruitment drives.
- **Application Tracking**: Monitor student applications across companies.
- **Outcome Tracking**: Ground-truth recording of placement outcomes to refine ML models.

### 🧠 Machine Learning & ATS
- **ATS Benchmarking**: Standalone engine simulating real-world Applicant Tracking Systems.
- **Role Prediction Models**: XGBoost-powered models predicting the most suitable job families (e.g., Software Engineering, Data Science).
- **Profile Strength Index**: A composite score (0-100) indicating overall resume signal strength.

### 🤖 LLM Integration
- **Candidate Intelligence**: Generative AI insights built on top of structured ML data.
- **Automated Dossiers**: Executive summaries generated for recruiters and placement officers.

### 📊 Reports & Analytics
- **Placement Admin Dashboard**: Cohort-wide analytics and conversion funnels.
- **Skill Taxonomy Mapping**: View aggregate skill deficits across entire cohorts.

### 🔒 Security
- **Role-Based Access Control (RBAC)**: Secure access for Students, Admins, and PRs.
- **Rate Limiting**: API abuse protection.
- **Secure Uploads**: Hardened file validation for PDFs and documents.

---

## 🏗 Architecture

JobMode operates on a microservices-inspired monolithic architecture, dividing responsibilities into distinct domains.

- **Frontend (React/Vite)**: Component-driven architecture using modern hooks and modular CSS/Tailwind.
- **Backend (FastAPI)**: High-performance asynchronous API layer.
- **Database (SQLite/PostgreSQL)**: Relational data modeling using SQLAlchemy ORM.
- **ML Layer**: Scikit-learn and XGBoost pipelines for predictive intelligence.
- **LLM Layer**: Integration with Gemini/OpenAI for semantic reasoning.

*(See [Architecture Documentation](./docs/Architecture.md) for detailed diagrams.)*

---

## 📸 Screenshots

*(Add screenshots here)*
- **Landing Page**: `![Landing Page](./docs/assets/landing.png)`
- **Student Dashboard**: `![Dashboard](./docs/assets/dashboard.png)`
- **ATS Analyzer**: `![ATS](./docs/assets/ats.png)`
- **Placement Admin**: `![Placement](./docs/assets/placement.png)`
- **Reports Dossier**: `![Reports](./docs/assets/reports.png)`

---

## 💻 Technology Stack

### Frontend
- React 19, Vite, TailwindCSS, React Router 7, Axios

### Backend
- Python 3.9+, FastAPI, Uvicorn, SQLAlchemy, Pydantic

### Machine Learning
- Scikit-learn, XGBoost, spaCy, Pandas, NumPy

### Database & Deployment
- SQLite (Development) / PostgreSQL (Production)
- Docker, GitHub Actions (CI/CD)

---

## 📂 Folder Structure

```text
JobMode/
├── backend/               # FastAPI Backend
│   ├── ai_model/          # ML models & training scripts
│   ├── api/               # API Routers & Endpoints
│   ├── database/          # SQLAlchemy Models & Migrations
│   ├── placement/         # Core Placement Engine logic
│   ├── services/          # ATS, Intelligence, LLM services
│   └── main.py            # Application Entrypoint
├── frontend/              # React/Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route views
│   │   └── index.css      # Global styles
├── docs/                  # Detailed Project Documentation
├── .github/               # CI/CD & Issue Templates
├── start.bat              # Windows Development Launcher
└── docker-compose.yml     # Multi-container orchestration (Planned)
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/SAYANTH55/AI-Placement-Intelligence-Platform.git
cd AI-Placement-Intelligence-Platform
```

### 2. Environment Setup
Copy the example environment file and configure your secrets:
```bash
cp .env.example .env
```

### 3. Quick Start (Windows)
We provide a comprehensive startup script that builds the virtual environment, trains models, runs migrations, and boots both servers:
```cmd
.\start.bat
```

### 4. Manual Start
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
```
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

A complete `.env.example` is provided in the repository root. Critical variables include:

- `DATABASE_URL`: Connection string for the database (e.g., `sqlite:///ai_placement.db`).
- `SECRET_KEY`: Cryptographic key for JWT and session signing.
- `JWT_SECRET`: Secret key used specifically for token generation.
- `GEMINI_API_KEY`: API key for LLM candidate intelligence generation.
- `CORS_ORIGINS`: Comma-separated list of allowed origins.

---

## 📚 API Documentation

Once the backend is running, FastAPI provides automatic interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

*(See [API Documentation](./docs/API.md) for detailed payload structures.)*

---

## 🧠 AI & Machine Learning Pipeline

1. **Resume Upload**: User uploads a PDF.
2. **Parsing (spaCy)**: Text extraction and Named Entity Recognition (NER).
3. **Skill Detection**: Matching against a standard taxonomy.
4. **ATS Benchmarking**: Evaluating structural compliance and keyword density.
5. **Role Prediction (XGBoost)**: Multi-label classification for job family fit.
6. **Candidate Intelligence (LLM)**: Generative narrative explaining the candidate's profile.

*(See [Machine Learning](./docs/MachineLearning.md) for model specifics.)*

---

## 🔄 Placement Workflow

1. **Drive Creation**: Companies initiate recruitment drives.
2. **Eligibility Engine**: Hard filters (GPA, Course) and soft filters (Skills).
3. **Application**: Students apply; ATS engines pre-screen.
4. **Outcomes**: Placements are recorded, feeding data back into the `learning_layer` to continuously improve ML accuracy.

---

## 🛡️ Security

JobMode implements enterprise security standards:
- **Authentication**: JWT-based stateless auth.
- **Authorization**: RBAC for `student`, `admin`, and `pr` (Placement Representative).
- **Validation**: Strict Pydantic schemas prevent NoSQL/SQL injection and malformed payloads.

*(See [Security Guidelines](./docs/Security.md) for detailed policies.)*

---

## 🐳 Deployment

JobMode is Docker-ready. A standard `docker-compose` configuration allows you to spin up the entire stack seamlessly.

```bash
docker-compose up --build -d
```
*(See [Deployment Guide](./docs/Deployment.md) for production scaling instructions.)*

---

## 🤝 Contributing

We welcome contributions! Please review our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, branching strategy, and pull request process.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
