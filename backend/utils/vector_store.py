# utils/vector_store.py

import os
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

# Global tracker for document DBs
vector_dbs = {}

# Embedder
embedder = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def get_vector_db(filename: str):
    """
    Return Chroma vector store instance for a given filename.
    Creates new one if not exists.
    """
    # Create a safe folder name from filename
    safe_name = "".join(c for c in os.path.splitext(filename)[0] if c.isalnum() or c in (' ', '-', '_')).rstrip()
    folder = os.path.join("vector_dbs", safe_name)
    os.makedirs(folder, exist_ok=True)

    if filename not in vector_dbs:
        vector_dbs[filename] = Chroma(
            collection_name="chunks",
            embedding_function=embedder,
            persist_directory=folder
        )
    return vector_dbs[filename]

def save_to_vector_store(chunks: list[Document], filename: str):
    """
    Save list of document chunks to the corresponding vector DB.
    """
    if not chunks:
        print("⚠️ No chunks to save")
        return
        
    db = get_vector_db(filename)
    try:
        # Clear existing data for this document to avoid duplicates
        try:
            db.delete_collection()
            # Recreate the database
            vector_dbs[filename] = Chroma(
                collection_name="chunks",
                embedding_function=embedder,
                persist_directory=os.path.join("vector_dbs", "".join(c for c in os.path.splitext(filename)[0] if c.isalnum() or c in (' ', '-', '_')).rstrip())
            )
            db = vector_dbs[filename]
        except:
            pass  # If deletion fails, continue with adding documents
        
        db.add_documents(chunks)
        print(f"✅ Saved {len(chunks)} chunks to vector store")
    except Exception as e:
        print(f"❌ Error saving to vector store: {e}")

def query_vector_store(query: str, filename: str, k=12):
    """
    Enhanced search for relevant chunks with intelligent k selection and better retrieval
    """
    try:
        db = get_vector_db(filename)
        
        # Adjust k based on query type
        query_lower = query.lower()
        comprehensive_indicators = ["all", "every", "complete", "entire", "full", "comprehensive", "total", "projects", "experience", "skills"]
        
        if any(indicator in query_lower for indicator in comprehensive_indicators):
            k = min(20, k * 2)  # Increase k for comprehensive queries
        
        # Use multiple search strategies for better coverage
        results = []
        
        # Strategy 1: Standard similarity search
        similarity_results = db.similarity_search(query, k=k)
        results.extend(similarity_results)
        
        # Strategy 2: Search with score threshold for broader results
        try:
            scored_results = db.similarity_search_with_score(query, k=k*2)
            # Use a more lenient score threshold
            filtered_results = [doc for doc, score in scored_results if score < 1.2]
            for doc in filtered_results:
                if doc not in results:
                    results.append(doc)
        except:
            pass
        
        # Strategy 3: For project/experience queries, search for related terms
        if any(term in query_lower for term in ["project", "projects", "work", "experience", "built", "developed"]):
            related_queries = ["project", "developed", "built", "created", "implemented", "designed"]
            for related_query in related_queries:
                try:
                    related_results = db.similarity_search(related_query, k=5)
                    for doc in related_results:
                        if doc not in results:
                            results.append(doc)
                except:
                    continue
        
        # Remove duplicates while preserving order
        unique_results = []
        seen_content = set()
        for result in results:
            content_hash = hash(result.page_content[:100])  # Use first 100 chars as identifier
            if content_hash not in seen_content:
                unique_results.append(result)
                seen_content.add(content_hash)
        
        # Limit final results
        final_results = unique_results[:k]
        
        # Ensure we prioritize special chunks for comprehensive queries
        if any(indicator in query_lower for indicator in comprehensive_indicators):
            regular_results = [r for r in final_results if r.metadata.get("chunk_type") != "full_summary"]
            summary_results = [r for r in final_results if r.metadata.get("chunk_type") == "full_summary"]
            final_results = summary_results + regular_results
        
        print(f"🔍 Found {len(final_results)} relevant chunks")
        return final_results
    except Exception as e:
        print(f"❌ Error querying vector store: {e}")
        return []

def clear_vector_store(filename: str):
    """
    Clear vector store for a specific file
    """
    try:
        if filename in vector_dbs:
            db = vector_dbs[filename]
            db.delete_collection()
            del vector_dbs[filename]
            print(f"🗑️ Cleared vector store for {filename}")
    except Exception as e:
        print(f"❌ Error clearing vector store: {e}")

def get_vector_store_stats(filename: str):
    """
    Get statistics about the vector store
    """
    try:
        db = get_vector_db(filename)
        # Try to get collection info
        collection = db._collection
        count = collection.count()
        return {"document_count": count, "status": "active"}
    except Exception as e:
        return {"document_count": 0, "status": "error", "error": str(e)}
