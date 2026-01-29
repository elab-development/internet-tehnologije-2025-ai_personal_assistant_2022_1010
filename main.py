from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import database
import auth
import rag
from pydantic import BaseModel

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
models.Base.metadata.create_all(bind=database.engine)

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str
    created_at: str

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]

# Routes
@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, password_hash=hashed_password, email=user.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username}

@app.post("/api/auth/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    # Special check for pre-created admin if not in DB yet (edge case if startup event failed)
    if user.username == "admin" and user.password == "admin123":
        # Check if admin exists in DB, if not create
        db_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not db_user:
             hashed_pw = auth.get_password_hash("admin123")
             new_admin = models.User(username="admin", password_hash=hashed_pw, role="admin")
             db.add(new_admin)
             db.commit()
             db.refresh(new_admin)

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.username, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": {"username": db_user.username, "role": db_user.role}}

@app.get("/api/documents")
def get_documents(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role == "admin":
        docs = db.query(models.Document).all()
    else:
        docs = db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    return [{"id": d.id, "title": d.title, "filename": d.filename, "created_at": str(d.created_at)} for d in docs]

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    content = (await file.read()).decode("utf-8", errors="ignore") 
    
    new_doc = models.Document(
        user_id=current_user.id,
        title=file.filename,
        filename=file.filename,
        content=content,
        file_type="txt"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Add to RAG index
    rag.add_document_to_index(new_doc.id, content)
    
    return {"id": new_doc.id, "filename": new_doc.filename}

@app.post("/api/query", response_model=QueryResponse)
def query_rag(request: QueryRequest, current_user: models.User = Depends(auth.get_current_user)):
    results = rag.query_index(request.query)
    answer = rag.generate_answer(request.query, results)
    return {"answer": answer, "sources": results}

@app.get("/api/users")
def get_users(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).all()

# Startup event to create admin
@app.on_event("startup")
def startup_event():
    # We can't use 'yield' dependency here easily, so manual session
    db = database.SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            hashed_pw = auth.get_password_hash("admin123")
            new_admin = models.User(username="admin", password_hash=hashed_pw, role="admin")
            db.add(new_admin)
            db.commit()
            print("Admin user created")
    finally:
        db.close()
