from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import database
import auth
import rag
from pydantic import BaseModel
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import uuid

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = database.SessionLocal()
    try:
        # Existing admin logic
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            hashed_pw = auth.get_password_hash("admin123")
            new_admin = models.User(username="admin", password_hash=hashed_pw, role="admin")
            db.add(new_admin)
            db.commit()
            print("✅ Admin user created: admin/admin123")

        # NEW: Sync documents on startup
        print("🔍 Syncing registered documents...")
        registered_docs = db.query(models.Document).filter(models.Document.is_guest == False).all()
        rag.sync_existing_documents(registered_docs)
    finally:
        db.close()
    
    yield
    
    # Cleanup old guest documents
    db = database.SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(hours=2)
        expired = db.query(models.Document).filter(
            models.Document.is_guest == True,
            models.Document.created_at < cutoff
        ).delete()
        db.commit()
        print(f"🧹 Cleaned {expired} expired guest documents")
    finally:
        db.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

# ========== SCHEMAS ==========

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]

# ========== AUTH ROUTES ==========

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    print(f"\n📝 REGISTER: {user.username}")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        email=user.email,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    print(f"✅ User created: {new_user.username} (ID: {new_user.id})")
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}

@app.post("/api/auth/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(database.get_db)):
    print(f"\n🔐 LOGIN: {user.username}")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": db_user.username, "role": db_user.role})
    
    print(f"✅ Login success: {db_user.username} (Role: {db_user.role})")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": db_user.username, "role": db_user.role, "id": db_user.id}
    }

@app.post("/api/auth/guest", response_model=Token)
def guest_login():
    session_id = str(uuid.uuid4())
    print(f"\n👤 GUEST LOGIN: {session_id}")
    
    access_token = auth.create_access_token(data={
        "sub": "guest",
        "role": "guest",
        "session_id": session_id
    })
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": "guest", "role": "guest", "session_id": session_id}
    }

@app.post("/api/auth/logout")
def logout(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    """Delete guest documents on logout"""
    print(f"\n🚪 LOGOUT: {current_user.username}")
    
    if current_user.role == "guest" and hasattr(current_user, 'session_id'):
        session_id = current_user.session_id
        
        # Delete guest documents
        deleted = db.query(models.Document).filter(
            models.Document.is_guest == True,
            models.Document.session_id == session_id
        ).delete()
        
        # Remove from RAG
        docs_to_remove = db.query(models.Document).filter(
            models.Document.is_guest == True,
            models.Document.session_id == session_id
        ).all()
        
        for doc in docs_to_remove:
            try:
                rag.remove_document_from_index(doc.id)
            except:
                pass
        
        db.commit()
        print(f"🗑️  Deleted {deleted} guest documents for session {session_id}")
    
    return {"message": "Logged out successfully"}

# ========== DOCUMENT ROUTES ==========

@app.get("/api/documents")
def get_documents(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    print(f"\n📄 GET DOCUMENTS: {current_user.username} (Role: {current_user.role})")
    
    if current_user.role == "admin":
        # ADMIN SEES EVERYTHING
        docs = db.query(models.Document).all()
        print(f"👑 Admin: returning ALL {len(docs)} documents")
        
    elif current_user.role == "guest":
        # GUEST SEES ONLY THEIR SESSION DOCS
        session_id = getattr(current_user, 'session_id', None)
        if not session_id:
            print("⚠️  Guest has no session_id")
            return []
        
        docs = db.query(models.Document).filter(
            models.Document.is_guest == True,
            models.Document.session_id == session_id
        ).all()
        print(f"👤 Guest {session_id[:8]}: {len(docs)} documents")
        
    else:
        # USER SEES ONLY THEIR OWN DOCS
        docs = db.query(models.Document).filter(
            models.Document.user_id == current_user.id,
            models.Document.is_guest == False
        ).all()
        print(f"👤 User {current_user.username}: {len(docs)} documents")
    
    return [{"id": d.id, "title": d.title, "filename": d.filename, "created_at": str(d.created_at)} for d in docs]

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"\n📤 UPLOAD: {file.filename} by {current_user.username}")
    
    # Read file
    file_bytes = await file.read()
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else 'txt'
    
    # Extract text
    content = ""
    
    if file_extension == 'pdf':
        try:
            import pypdf
            import io
            
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    content += page_text + "\n\n"
            
            if not content.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")
    else:
        content = file_bytes.decode("utf-8", errors="ignore")
    
    if not content.strip():
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Determine storage type
    is_guest = current_user.role == "guest"
    session_id = getattr(current_user, 'session_id', None) if is_guest else None
    user_id = None if is_guest else current_user.id
    
    # Save to database
    new_doc = models.Document(
        user_id=user_id,
        session_id=session_id,
        is_guest=is_guest,
        title=file.filename,
        filename=file.filename,
        content=content,
        file_type=file_extension
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Add to RAG - CRITICAL: Add guest documents too!
    try:
        rag.add_document_to_index(new_doc.id, content, is_guest=is_guest, session_id=session_id)
        print(f"✅ Added to RAG: doc_id={new_doc.id}, guest={is_guest}")
    except Exception as e:
        print(f"⚠️  RAG error: {e}")
    
    return {"id": new_doc.id, "filename": new_doc.filename}

@app.delete("/api/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"\n🗑️  DELETE: doc_id={doc_id} by {current_user.username}")
    
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Permission check
    if current_user.role == "admin":
        pass  # Admin can delete anything
    elif current_user.role == "guest":
        session_id = getattr(current_user, 'session_id', None)
        if not doc.is_guest or doc.session_id != session_id:
            raise HTTPException(status_code=403, detail="Not your document")
    else:
        if doc.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your document")
    
    # Delete from DB
    db.delete(doc)
    db.commit()
    
    # Remove from RAG
    try:
        rag.remove_document_from_index(doc_id)
    except Exception as e:
        print(f"⚠️  RAG removal error: {e}")
    
    print(f"✅ Deleted doc_id={doc_id}")
    return {"message": "Document deleted", "id": doc_id}

# ========== CHATBOT ROUTES ==========

@app.post("/api/query", response_model=QueryResponse)
def query_rag(
    request: QueryRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    print(f"\n💬 QUERY: '{request.query}' by {current_user.username} (Role: {current_user.role})")
    
    # Determine accessible documents
    if current_user.role == "admin":
        # ADMIN: All non-guest documents
        accessible_docs = db.query(models.Document).filter(models.Document.is_guest == False).all()
        print(f"👑 Admin can access {len(accessible_docs)} user documents")
        
    elif current_user.role == "guest":
        # GUEST: Only their session documents
        session_id = getattr(current_user, 'session_id', None)
        if not session_id:
            return {
                "answer": "Please upload a document so I can help you.",
                "sources": []
            }
        
        accessible_docs = db.query(models.Document).filter(
            models.Document.is_guest == True,
            models.Document.session_id == session_id
        ).all()
        
        print(f"👤 Guest {session_id[:8]} can access {len(accessible_docs)} documents")
        
        if not accessible_docs:
            return {
                "answer": "Please upload a document so I can help you.",
                "sources": []
            }
        
    else:
        # USER: Only their own documents
        accessible_docs = db.query(models.Document).filter(
            models.Document.user_id == current_user.id,
            models.Document.is_guest == False
        ).all()
        print(f"👤 User {current_user.username} can access {len(accessible_docs)} documents")
        
        if not accessible_docs:
            return {
                "answer": "You don't have any documents uploaded yet. Please upload a document first.",
                "sources": []
            }
    
    accessible_doc_ids = [d.id for d in accessible_docs]
    
    # Query RAG
    all_results = rag.query_index(request.query, k=10)
    print(f"🔍 RAG returned {len(all_results)} results")
    
    # Filter to accessible documents only
    filtered_results = [r for r in all_results if r.get('id') in accessible_doc_ids]
    print(f"✅ After filtering: {len(filtered_results)} accessible results")
    
    if not filtered_results:
        if current_user.role == "guest":
            return {
                "answer": "I couldn't find relevant information in your uploaded document. Try asking something else or upload a different document.",
                "sources": []
            }
        return {
            "answer": "I couldn't find any relevant information in your documents to answer this question.",
            "sources": []
        }
    
    # Generate answer
    answer = rag.generate_answer(request.query, filtered_results)
    
    return {"answer": answer, "sources": filtered_results}

@app.get("/api/users")
def get_users(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return db.query(models.User).all()