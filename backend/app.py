# app.py
import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
from werkzeug.utils import secure_filename
from utils.file_reader import read_file_text
from utils.embedder import embed_text_chunks
from utils.vector_store import save_to_vector_store, query_vector_store
from utils.qa import generate_answer
from utils.table_qa import answer_question_from_table
from dotenv import load_dotenv
import os
import pandas as pd
import tempfile
from urllib.parse import urlparse

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'txt', 'pdf', 'docx', 'doc', 'csv', 'xlsx', 'xls', 
    'pptx', 'ppt', 'png', 'jpg', 'jpeg', 'json', 'xml'
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Global state to store multiple documents
documents_collection = {
    'documents': [],  # List of document objects
    'current_index': 0,  # Index of currently active document for Q&A
    'total_chunks': 0,  # Total chunks across all text documents
    'total_tables': 0   # Total number of table documents
}

def create_document_obj(content, filename, file_type, chunks=None):
    """Create a standardized document object"""
    return {
        'type': 'table' if isinstance(content, pd.DataFrame) or file_type == 'structured' else 'text',
        'content': content,
        'filename': filename,
        'chunks': chunks or [],
        'file_type': file_type,
        'status': 'loaded'
    }

def process_single_url(url):
    """Process a single URL and return document object and status"""
    try:
        url = url.strip()
        if not url:
            return None, "Empty URL provided"
        
        print(f"🔄 Processing URL: {url}")
        
        # Read the file from URL
        content, filename, file_type = read_file_text(url)
        
        if content is None:
            return None, f"Could not read file from URL: {url}"
        
        # Process based on content type
        if isinstance(content, pd.DataFrame) or file_type == 'structured':
            # It's a table/spreadsheet
            doc_obj = create_document_obj(content, filename, file_type)
            print(f"📊 Loaded table from {url}: {content.shape}")
            return doc_obj, f"Successfully loaded table with {content.shape[0]} rows and {content.shape[1]} columns"
        
        else:
            # It's a text document
            if not content or not content.strip():
                return None, f"File appears to be empty: {url}"
            
            # Create text chunks and embeddings
            try:
                chunks = embed_text_chunks(content, filename)
                doc_obj = create_document_obj(content, filename, file_type, chunks)
                
                if chunks:
                    save_to_vector_store(chunks, filename)
                    print(f"📄 Created {len(chunks)} text chunks from {url}")
                    return doc_obj, f"Successfully loaded text document with {len(chunks)} chunks"
                else:
                    print(f"⚠️ No text chunks created from {url}")
                    return doc_obj, "Document loaded but no chunks created"
                    
            except Exception as e:
                print(f"❌ Error processing text from {url}: {e}")
                return None, f"Error processing text document: {str(e)}"
    
    except Exception as e:
        print(f"❌ Error processing URL {url}: {e}")
        return None, f"Error processing URL: {str(e)}"



@app.route("/upload_url", methods=["POST"])
def upload_url():
    global documents_collection

    try:
        data = request.get_json()
        urls = data.get("file_urls", [])

        if not urls or not isinstance(urls, list):
            return jsonify({"success": False, "error": "Please provide a list of URLs."}), 400

        processing_results = []
        new_documents = []

        for i, url in enumerate(urls):
            doc_obj, status_msg = process_single_url(url)

            if doc_obj:
                new_documents.append(doc_obj)
                processing_results.append(f"✅ URL {i+1}: {status_msg}")
            else:
                processing_results.append(f"❌ URL {i+1}: {status_msg}")

        if new_documents:
            documents_collection['documents'].extend(new_documents)
            documents_collection['total_chunks'] = sum(len(doc['chunks']) for doc in documents_collection['documents'] if doc['type'] == 'text')
            documents_collection['total_tables'] = sum(1 for doc in documents_collection['documents'] if doc['type'] == 'table')

            return jsonify({
                "success": True,
                "message": f"Loaded {len(new_documents)} new document(s).",
                "processing_results": processing_results,
                "documents": documents_collection['documents']
            })

        else:
            return jsonify({
                "success": False,
                "error": "No documents could be loaded.",
                "processing_results": processing_results
            }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Unexpected error: {str(e)}"
        }), 500



@app.route("/ask", methods=["POST"])
def ask():
    global documents_collection
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        question = data.get("question", "").strip()
        search_mode = data.get("search_mode", "current")  # 'current', 'all', or specific document index
        
        if not question:
            return jsonify({"error": "Please provide a question."}), 400
        
        print(f"❓ Question: {question} (Mode: {search_mode})")
        
        # Check if we have any documents loaded
        if not documents_collection['documents']:
            return jsonify({"answer": "⚠️ No documents loaded. Please upload files first."})
        
        # Determine which documents to search
        if search_mode == "all":
            # Search across all documents
            target_documents = documents_collection['documents']
            search_description = f"all {len(target_documents)} documents"
        elif search_mode == "current":
            # Search only current document
            if documents_collection['current_index'] < len(documents_collection['documents']):
                target_documents = [documents_collection['documents'][documents_collection['current_index']]]
                search_description = f"current document ({target_documents[0]['filename']})"
            else:
                return jsonify({"answer": "⚠️ No current document selected."})
        elif search_mode.isdigit():
            # Search specific document by index
            doc_index = int(search_mode)
            if 0 <= doc_index < len(documents_collection['documents']):
                target_documents = [documents_collection['documents'][doc_index]]
                search_description = f"document {doc_index + 1} ({target_documents[0]['filename']})"
            else:
                return jsonify({"answer": "⚠️ Invalid document index."})
        else:
            target_documents = [documents_collection['documents'][documents_collection['current_index']]]
            search_description = f"current document"
        
        # Process the question across target documents
        all_answers = []
        
        for doc in target_documents:
            try:
                if doc['type'] == 'table':
                    # Handle table questions
                    if isinstance(doc['content'], pd.DataFrame) and not doc['content'].empty:
                        answer = answer_question_from_table(doc['content'], question)
                        all_answers.append(f"📊 From {doc['filename']}:\n{answer}")
                    else:
                        all_answers.append(f"⚠️ Table data in {doc['filename']} is empty or invalid.")
                
                elif doc['type'] == 'text':
                    # Handle text questions
                    if isinstance(doc['content'], str) and doc['content'].strip():
                        if doc['chunks']:
                            # Use vector search for better results
                            relevant_chunks = query_vector_store(question, doc['filename'])
                            if relevant_chunks:
                                answer = generate_answer(question, relevant_chunks)
                                all_answers.append(f"📄 From {doc['filename']}:\n{answer}")
                            else:
                                # Fallback to direct text search
                                answer = generate_answer_from_text(question, doc['content'])
                                all_answers.append(f"📄 From {doc['filename']} (fallback):\n{answer}")
                        else:
                            # Use direct text if no chunks
                            answer = generate_answer_from_text(question, doc['content'])
                            all_answers.append(f"📄 From {doc['filename']}:\n{answer}")
                    else:
                        all_answers.append(f"⚠️ Text content in {doc['filename']} is empty or invalid.")
                
            except Exception as e:
                print(f"❌ Error processing {doc['filename']}: {e}")
                all_answers.append(f"❌ Error processing {doc['filename']}: {str(e)}")
        
        # Combine all answers
        if all_answers:
            if len(all_answers) == 1:
                final_answer = all_answers[0]
            else:
                final_answer = f"🔍 Searched {search_description}:\n\n" + "\n\n---\n\n".join(all_answers)
            
            print(f"✅ Answer generated from {len(target_documents)} document(s)")
            return jsonify({"answer": final_answer})
        else:
            return jsonify({"answer": "⚠️ No valid answers could be generated from the selected documents."})
    
    except Exception as e:
        print(f"❌ Unexpected error in ask route: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

def generate_answer_from_text(question, text):
    """
    Generate answer directly from text without vector search (fallback method)
    """
    try:
        # Truncate text if too long
        MAX_CHARS = 4000
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS] + "..."
        
        prompt = f"""Based on the following document content, answer the question:

Document Content:
{text}

Question: {question}

Please provide a clear and accurate answer based on the document content:"""

        headers = {
            "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama3-8b-8192",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 1000
        }

        import requests
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
        else:
            return f"Error getting response from AI service: {response.status_code}"
            
    except Exception as e:
        return f"Error generating answer: {str(e)}"

@app.route("/status")
def status():
    """
    Get current documents collection status
    """
    global documents_collection
    
    if not documents_collection['documents']:
        return jsonify({"status": "No documents loaded"})
    
    documents_info = []
    for i, doc in enumerate(documents_collection['documents']):
        if doc['type'] == 'table':
            doc_info = {
                "index": i,
                "type": "table",
                "filename": doc['filename'],
                "shape": doc['content'].shape,
                "columns": list(doc['content'].columns),
                "is_current": i == documents_collection['current_index']
            }
        else:
            doc_info = {
                "index": i,
                "type": "text",
                "filename": doc['filename'],
                "chunks": len(doc['chunks']),
                "length": len(doc['content']),
                "is_current": i == documents_collection['current_index']
            }
        documents_info.append(doc_info)
    
    return jsonify({
        "status": f"{len(documents_collection['documents'])} documents loaded",
        "total_documents": len(documents_collection['documents']),
        "total_chunks": documents_collection['total_chunks'],
        "total_tables": documents_collection['total_tables'],
        "current_index": documents_collection['current_index'],
        "documents": documents_info
    })

@app.route("/switch_document", methods=["POST"])
def switch_document():
    """
    Switch the current active document for Q&A
    """
    global documents_collection
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        doc_index = data.get("index")
        if doc_index is None:
            return jsonify({"error": "Document index not provided"}), 400
        
        if 0 <= doc_index < len(documents_collection['documents']):
            documents_collection['current_index'] = doc_index
            current_doc = documents_collection['documents'][doc_index]
            return jsonify({
                "success": True,
                "message": f"Switched to document: {current_doc['filename']}",
                "current_document": {
                    "index": doc_index,
                    "filename": current_doc['filename'],
                    "type": current_doc['type']
                }
            })
        else:
            return jsonify({"error": "Invalid document index"}), 400
            
    except Exception as e:
        return jsonify({"error": f"Error switching document: {str(e)}"}), 500

@app.route("/clear_documents", methods=["POST"])
def clear_documents():
    """
    Clear all loaded documents
    """
    global documents_collection
    
    try:
        documents_collection = {
            'documents': [],
            'current_index': 0,
            'total_chunks': 0,
            'total_tables': 0
        }
        
        return jsonify({
            "success": True,
            "message": "All documents cleared successfully"
        })
        
    except Exception as e:
        return jsonify({"error": f"Error clearing documents: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)