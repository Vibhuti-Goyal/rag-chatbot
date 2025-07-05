import os
import re
import requests
import fitz  # PyMuPDF
from io import BytesIO
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document
from dotenv import load_dotenv

load_dotenv()


def extract_text(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers)
        url_lower = url.lower() 
        content_type = r.headers.get("Content-Type", "").lower()  # ✅ Fix: add this

        if url_lower.endswith(".pdf") or "application/pdf" in content_type:
            doc = fitz.open(stream=BytesIO(r.content), filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)

        elif url_lower.endswith(".docx") or "wordprocessingml" in content_type:
            import docx  # ✅ Add this import here if not already done
            doc = docx.Document(BytesIO(r.content))
            text = "\n".join(p.text for p in doc.paragraphs)

        else:
            r.encoding = 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'noscript']):
                tag.decompose()
            text = soup.get_text(separator='\n', strip=True)
            text = re.sub(r'\n{2,}', '\n', text)
            text = re.sub(r'\s{2,}', ' ', text)

        return text.strip()

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return ""



def build_vectordb(main_url, links):
    name = urlparse(main_url).netloc.replace('.', '_')
    path = f"vectordb/{name}_vectordb"
    os.makedirs(path, exist_ok=True)

    docs = []
    for i, link in enumerate(links):
        text = extract_text(link)
        print(f"🔗 {i+1}/{len(links)} {link} ➜ {len(text)} chars")
        if text:
            docs.append(Document(page_content=text, metadata={"source": link}))

    if not docs:
        print("⚠️ No valid content found to create vector DB.")
        return None

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma.from_documents(docs, embeddings, persist_directory=path)
    vectordb.persist()
    print(f"✅ Vector DB created at: {path}")
    return path
