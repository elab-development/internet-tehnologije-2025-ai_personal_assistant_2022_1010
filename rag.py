import faiss
import numpy as np
import requests
import json
import os

# Configuration
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
MODEL_NAME = "llama2" # Or whatever is installed
EMBEDDING_MODEL = "nomic-embed-text" # Or llama2

# In-memory FAISS index (simplification for MVP)
# In production, save/load from disk
index = None
documents_map = {} # id -> content mapping

def get_embedding(text: str):
    try:
        response = requests.post(f"{OLLAMA_HOST}/api/embeddings", json={
            "model": MODEL_NAME, # Using main model for embeddings if specialized one not available
            "prompt": text
        })
        if response.status_code == 200:
            return response.json().get("embedding")
        # Fallback/Error handling
        print(f"Embedding error: {response.text}")
        return [0.0] * 4096 # Dummy dimension
    except Exception as e:
        print(f"Ollama connection error: {e}")
        return [0.0] * 4096

def add_document_to_index(doc_id: int, content: str):
    global index
    embedding = get_embedding(content)
    vector = np.array([embedding], dtype=np.float32)
    
    if index is None:
        dimension = vector.shape[1]
        index = faiss.IndexFlatL2(dimension)
    
    index.add(vector)
    documents_map[index.ntotal - 1] = {"id": doc_id, "content": content}

def query_index(query: str, k: int = 3):
    global index
    if index is None or index.ntotal == 0:
        return []
    
    embedding = get_embedding(query)
    vector = np.array([embedding], dtype=np.float32)
    distances, indices = index.search(vector, k)
    
    results = []
    for idx in indices[0]:
        if idx != -1 and idx in documents_map:
            results.append(documents_map[idx])
    return results

def generate_answer(query: str, context: list):
    context_str = "\n\n".join([item["content"] for item in context])
    prompt = f"""Use the following pieces of context to answer the question at the end.
    
    Context:
    {context_str}
    
    Question: {query}
    
    Answer:"""
    
    try:
        response = requests.post(f"{OLLAMA_HOST}/api/generate", json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return response.json().get("response")
        return "Error generating answer from Ollama."
    except Exception as e:
        return f"Error connecting to Ollama: {e}"
