import os
from PyPDF2 import PdfReader
import docx

def read_file(filepath):
    """
    Read file content based on extension
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")
    
    ext = os.path.splitext(filepath)[1].lower()

    try:
        if ext == ".txt":
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                return content if content.strip() else "Empty file"

        elif ext == ".pdf":
            reader = PdfReader(filepath)
            text_content = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_content.append(text)
            
            result = "\n".join(text_content)
            return result if result.strip() else "No text found in PDF"

        elif ext in [".docx", ".doc"]:
            doc = docx.Document(filepath)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            
            result = "\n".join(paragraphs)
            return result if result.strip() else "No text found in document"

        else:
            # Try to read as plain text for unknown extensions
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                return content if content.strip() else f"Unknown file type: {ext}"
                
    except Exception as e:
        return f"Error reading file: {str(e)}"