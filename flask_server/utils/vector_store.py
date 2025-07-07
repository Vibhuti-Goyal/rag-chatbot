import os, re, requests, fitz, pytesseract
from io import BytesIO
from bs4 import BeautifulSoup
from urllib.parse import urlparse, unquote
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.docstore.document import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PIL import Image
from dotenv import load_dotenv
from utils.link_check import extract_links_from_any_url

load_dotenv()

def extract_text(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}

        if "drive.google.com" in url:
            match = re.search(r"/d/([a-zA-Z0-9_-]+)", url) or re.search(r"id=([a-zA-Z0-9_-]+)", url)
            if match:
                file_id = match.group(1)
                url = f"https://drive.google.com/uc?export=download&id={file_id}"

        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        content = BytesIO(r.content)
        content_type = r.headers.get("Content-Type", "").lower()
        url_lower = url.lower()

        if url_lower.endswith(".pdf") or "pdf" in content_type:
            return "\n".join(p.get_text() for p in fitz.open(stream=content, filetype="pdf"))

        elif url_lower.endswith(".docx") or "word" in content_type:
            import docx
            doc = docx.Document(content)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

        elif url_lower.endswith(".txt") or "text/plain" in content_type:
            return content.read().decode('utf-8', errors='ignore')

        elif url_lower.endswith((".png", ".jpg", ".jpeg")) or "image" in content_type:
            img = Image.open(content)
            # Better OCR with proper config
            text = pytesseract.image_to_string(img, config='--psm 6')
            return text.strip()

        else:
            r.encoding = 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'noscript']):
                tag.decompose()
            return re.sub(r'\n{2,}', '\n', soup.get_text(separator='\n', strip=True))

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return ""

def build_vectordb(links):
    # Use Drive file ID or filename as folder name
    if "drive.google.com" in links[0]:
        match = re.search(r"/d/([a-zA-Z0-9_-]+)", links[0]) or re.search(r"id=([a-zA-Z0-9_-]+)", links[0])
        name = match.group(1) if match else "drivefile"
    else:
        path = unquote(urlparse(links[0]).path)
        name = path.strip('/').split('/')[-1].split('?')[0].split('.')[0]

    vectordb_path = f"vectordb/{name}_vectordb"
    os.makedirs(vectordb_path, exist_ok=True)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    docs, full_text = [], ""

    for i, link in enumerate(links[:50]):
        text = extract_text(link)
        print(f"🔗 {i+1}/{len(links)} {link} ➜ {len(text)} chars")
        print(f"📝 Extracted text preview: {text[:100]}...")  # Debug line
        full_text += text + "\n\n"
        if text:
            for chunk in splitter.split_text(text):
                docs.append(Document(page_content=chunk, metadata={"source": link}))

    if not docs:
        print("⚠️ No valid content found.")
        return None, ""

    emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    Chroma.from_documents(docs, emb, persist_directory=vectordb_path)
    print(f"✅ Vector DB created at: {vectordb_path}")
    return vectordb_path, full_text