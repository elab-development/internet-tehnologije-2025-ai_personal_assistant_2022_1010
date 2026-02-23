import os
import requests
import numpy as np
import faiss

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434")
MODEL_NAME = "llama3.1:8b"

index = None
documents_map = {}  # faiss_idx -> {id, content, is_guest, session_id}

def get_embedding(text: str):
    try:
        resp = requests.post(f"{OLLAMA_HOST}/api/embeddings", json={
            "model": MODEL_NAME,
            "prompt": text
        })
        data = resp.json()
        emb = data.get("embedding")
        if emb is None:
            print(f"⚠️  No embedding returned: {data}")
            return [0.0] * 4096
        return emb
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return [0.0] * 4096

def add_document_to_index(doc_id: int, content: str, is_guest: bool = False, session_id: str = None):
    """Add document to FAISS index with session tracking"""
    global index, documents_map
    
    if not isinstance(content, str) or not content.strip():
        print(f"⚠️  Skipping empty content for doc {doc_id}")
        return
    
    print(f"📥 Adding doc {doc_id} to RAG (guest={is_guest}, session={session_id[:8] if session_id else 'None'})")
    
    embedding = get_embedding(content)
    vector = np.array([embedding], dtype=np.float32)

    if index is None:
        dimension = vector.shape[1]
        index = faiss.IndexFlatL2(dimension)
        print(f"🆕 Created FAISS index (dim={dimension})")

    index.add(vector)
    faiss_idx = index.ntotal - 1
    
    documents_map[faiss_idx] = {
        "id": doc_id,
        "content": content,
        "is_guest": is_guest,
        "session_id": session_id
    }
    
    print(f"✅ Doc {doc_id} added at index {faiss_idx}. Total docs in RAG: {index.ntotal}")

def query_index(query: str, k: int = 5):
    """Query FAISS index"""
    global index, documents_map
    
    if index is None or index.ntotal == 0:
        print("⚠️  RAG index is empty")
        return []

    print(f"🔍 Querying RAG: '{query}' (k={k})")
    
    embedding = get_embedding(query)
    vector = np.array([embedding], dtype=np.float32)
    
    k = min(k, index.ntotal)
    distances, indices = index.search(vector, k)

    results = []
    for idx, distance in zip(indices[0], distances[0]):
        if idx != -1 and idx in documents_map:
            doc = documents_map[idx].copy()
            doc['distance'] = float(distance)
            results.append(doc)
    
    print(f"✅ Found {len(results)} results")
    return results

def remove_document_from_index(doc_id: int):
    """Remove document from RAG index mapping"""
    global documents_map, index
    
    # Find the FAISS indices associated with this doc_id
    keys_to_remove = [k for k, v in documents_map.items() if v.get('id') == doc_id]
    
    for key in keys_to_remove:
        del documents_map[key]
        print(f"🗑️  Removed doc {doc_id} from RAG mapping (index {key})")
    
    # Note: We don't remove from the physical FAISS 'index' object 
    # because IndexFlatL2 doesn't support it well. 
    # Instead, our 'query_index' already filters results using documents_map.
def generate_answer(query: str, context: list):
    """Generate answer using Ollama"""
    if not context:
        return "I don't have any relevant documents to answer this question."
    
    context_str = "\n\n".join([
        f"Document {i+1}:\n{item['content'][:1000]}"
        for i, item in enumerate(context)
    ])
    
    prompt = f"""Based on the following documents, please answer the question.

Documents:
{context_str}

Question: {query}

Answer (provide a helpful response based on the documents above):"""

    try:
        resp = requests.post(f"{OLLAMA_HOST}/api/generate", json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        })
        data = resp.json()
        
        response_text = data.get("response")
        if response_text:
            return response_text
        
        print(f"⚠️  Unexpected Ollama response: {data}")
        return "No response from Ollama."
    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return f"Error generating answer: {e}"
    
def sync_existing_documents(docs_from_db: list):
    """Rebuild the RAG index from database records on startup"""
    global index, documents_map
    
    # Clear current state to avoid duplicates if the function is called twice
    index = None
    documents_map = {}

    if not docs_from_db:
        print("ℹ️  No existing documents to sync.")
        return

    for doc in docs_from_db:
        # Re-uses your existing add_document_to_index logic
        add_document_to_index(
            doc_id=doc.id, 
            content=doc.content, 
            is_guest=doc.is_guest, 
            session_id=doc.session_id
        )
    print(f"🔄 RAG Memory Restored: {len(docs_from_db)} documents loaded into FAISS.")