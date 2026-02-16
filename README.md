@"
# AI Personal Assistant Platform

**University Project** - Internet Technologies Course  
**Institution:** elab-development  
**Year:** 2025

A full-stack AI-powered personal assistant with RAG (Retrieval-Augmented Generation) capabilities, JWT authentication, and a modern web interface.

---

## 🎯 Features

### Backend (FastAPI + Python)
- 🔐 **JWT Authentication** - Secure user authentication with token-based system
- 📚 **RAG System** - Custom implementation using numpy for semantic search
- 📄 **PDF Processing** - Parse and extract information from PDF documents
- 💾 **SQLAlchemy ORM** - Database management with models and migrations
- 🔒 **Bcrypt Password Hashing** - Secure password storage

### Frontend (React + TypeScript)
- ⚛️ **React 18** - Modern component-based UI
- 📘 **TypeScript** - Type-safe development
- 🎨 **Responsive Design** - Works on desktop and mobile
- 🔄 **Real-time Updates** - Dynamic interaction with backend API

### DevOps
- 🐳 **Docker** - Containerized backend and frontend
- 🚀 **Docker Compose** - Multi-container orchestration
- 📦 **Easy Deployment** - One-command startup script for Windows

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python 3.11) |
| **Frontend** | React + TypeScript |
| **Database** | SQLAlchemy + SQLite |
| **Authentication** | JWT (python-jose) |
| **AI/ML** | Custom RAG with numpy |
| **PDF Parsing** | pypdf |
| **Containerization** | Docker + Docker Compose |
| **Package Management** | pip (Python), npm (Node.js) |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Git installed

### Run with Docker (Recommended)

**Windows:**
``````bash
start-app.bat
``````

**Linux/Mac:**
``````bash
docker-compose up --build
``````

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📁 Project Structure
``````
├── backend/
│   ├── main.py           # FastAPI entry point
│   ├── models.py         # Database models
│   ├── auth.py           # JWT authentication
│   ├── rag.py            # RAG system implementation
│   └── database.py       # Database configuration
├── frontend/
│   ├── src/              # React components
│   ├── server/           # TypeScript server
│   └── public/           # Static assets
├── Dockerfile.backend    # Backend container config
├── Dockerfile.frontend   # Frontend container config
├── docker-compose.yml    # Multi-container setup
├── requirements.txt      # Python dependencies
└── package.json          # Node.js dependencies
``````

---

## 👥 Contributors

| Account | Role | Contributions |
|---------|------|---------------|
| **Danny-Shammas** | Backend Developer | Database models, Authentication, RAG system |
| **makija14** | Frontend Developer | React UI, TypeScript server, Configuration |
| **Minja333** | DevOps Engineer | Docker setup, Deployment scripts, Documentation |

---

## 📝 Development

### Backend Development
``````bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
``````

### Frontend Development
``````bash
cd frontend
npm install
npm run dev
``````

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login (returns JWT) |
| GET | `/api/chat` | Chat with AI assistant |
| POST | `/api/upload` | Upload PDF document |
| GET | `/api/search` | Semantic search in documents |

---

## 📄 License

This project is part of academic coursework at elab-development.

---

## 🙏 Acknowledgments

- **Course:** Internet Technologies 2025
- **Institution:** elab-development
- **Project Type:** University Assignment

---

**Built with ❤️ by the team**
"@ | Out-File -FilePath README.md -Encoding UTF8