# utils/embedder.py

from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import re
import json

def embed_text_chunks(text, filename):
    """
    Universal text chunking for any type of content
    """
    if not text or not isinstance(text, str):
        print("⚠️ No valid text to embed")
        return []
    
    try:
        documents = []
        
        # Detect content type for optimal chunking strategy
        content_type = detect_content_type(text)
        print(f"📝 Detected content type: {content_type}")
        
        # Apply appropriate chunking strategy
        if content_type == "structured":
            documents.extend(create_structured_chunks(text, filename))
        elif content_type == "code":
            documents.extend(create_code_chunks(text, filename))
        elif content_type == "resume":
            documents.extend(create_resume_chunks(text, filename))
        else:
            documents.extend(create_general_chunks(text, filename))
        
        # Always create a full document summary
        summary_chunk = create_document_summary(text, filename)
        if summary_chunk:
            documents.append(summary_chunk)

        print(f"📄 Created {len(documents)} text chunks")
        return documents
        
    except Exception as e:
        print(f"❌ Error creating text chunks: {e}")
        return []

def detect_content_type(text):
    """
    Detect the type of content to apply appropriate chunking
    """
    text_lower = text.lower()
    
    # Check for structured data indicators
    if any(indicator in text for indicator in ['{', '}', '[', ']', '<', '>', 'xml', 'json']):
        return "structured"
    
    # Check for code indicators
    code_indicators = ['def ', 'function', 'class ', 'import ', '#include', 'public class', 'private ', 'public ']
    if any(indicator in text_lower for indicator in code_indicators):
        return "code"
    
    # Check for resume indicators
    resume_indicators = ['experience', 'education', 'skills', 'projects', 'resume', 'cv', 'linkedin', 'github']
    if sum(1 for indicator in resume_indicators if indicator in text_lower) >= 3:
        return "resume"
    
    return "general"

def create_general_chunks(text, filename):
    """
    General purpose chunking for any text content
    """
    documents = []
    
    strategies = [
        {"size": 1 * 1024, "strategy": CharacterTextSplitter()},
        {"size": 2 * 1024, "strategy": RecursiveCharacterTextSplitter(chunk_size=2 * 1024, chunk_overlap=100)},
        {"size": 4 * 1024, "strategy": RecursiveCharacterTextSplitter(chunk_size=4 * 1024, chunk_overlap=200)},
        {"size": 8 * 1024, "strategy": RecursiveCharacterTextSplitter(chunk_size=8 * 1024, chunk_overlap=300)}
    ]
    
    for strat in strategies:
        splitter = strat["strategy"]
        chunks = splitter.split_text(text)
        for chunk in chunks:
            documents.append(Document(page_content=chunk, metadata={"filename": filename, "chunk_size": strat["size"]}))
    
    return documents

def create_code_chunks(text, filename):
    """
    Chunking optimized for code files
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
    chunks = splitter.split_text(text)
    return [Document(page_content=chunk, metadata={"filename": filename, "type": "code"}) for chunk in chunks]

def create_structured_chunks(text, filename):
    """
    Chunking for JSON, XML, etc.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=100)
    chunks = splitter.split_text(text)
    return [Document(page_content=chunk, metadata={"filename": filename, "type": "structured"}) for chunk in chunks]

def create_resume_chunks(text, filename):
    """
    Chunking strategy tailored for resumes
    """
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
    chunks = splitter.split_text(text)
    return [Document(page_content=chunk, metadata={"filename": filename, "type": "resume"}) for chunk in chunks]

def create_document_summary(text, filename):
    """
    Create a summary chunk from the entire text
    """
    if len(text.strip()) < 100:
        return None
    return Document(page_content=text[:4000], metadata={"filename": filename, "summary": True})
