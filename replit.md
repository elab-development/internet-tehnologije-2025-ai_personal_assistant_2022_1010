# Personal Knowledge Base AI Assistant

## Overview
A full-stack Personal Knowledge Base AI Assistant built with Python/FastAPI backend and React frontend. Allows users to upload documents, index them using FAISS vectors, and query them using RAG (Retrieval-Augmented Generation) with a local Ollama LLM.

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy (SQLite)
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Vector Store**: FAISS
- **LLM**: Ollama (local)
- **Auth**: JWT-based authentication with bcrypt password hashing

## Architecture
The application runs two servers:
1. **Node.js/Express** (port 5000) - Serves the React frontend and proxies `/api` requests
2. **Python/FastAPI** (port 8000) - Backend API for auth, documents, and RAG

## User Roles
- **Admin** (admin/admin123): Manage all users and documents, rebuild index
- **Normal User**: Manage own profile and documents, query own data
- **Guest**: Limited read-only access

## Key Files
- `main.py` - FastAPI app with all routes
- `auth.py` - JWT authentication and password hashing
- `rag.py` - FAISS indexing and Ollama LLM client
- `database.py` - SQLAlchemy setup
- `models.py` - Database models
- `server/routes.ts` - Express proxy to Python backend

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/guest` - Guest login (no password)
- `GET /api/documents` - List user's documents
- `POST /api/upload` - Upload document (multipart)
- `POST /api/query` - RAG query against indexed documents
- `GET /api/users` - Admin only: list all users

## Running the App
The workflow runs `npm run dev` which:
1. Starts the Python FastAPI backend on port 8000
2. Starts the Node.js Express + Vite dev server on port 5000
3. Proxies `/api` requests from port 5000 to port 8000

## Notes
- Ollama must be running locally for RAG to work
- Default admin credentials: admin/admin123
- SQLite database stored at `pkb.db`
