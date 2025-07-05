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
from utils.link_check import extract_links_from_any_url, extract_links_from_drive_folder

load_dotenv()

def extract_text(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}

        # Handle Google Drive file links
        if "drive.google.com" in url:
            match = re.findall(r"/d/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)", url)
            if match:
                file_id = match[0][0] or match[0][1]
                url = f"https://drive.google.com/uc?export=download&id={file_id}"
        else:
            raise ValueError("Not a valid Drive file link.")


        r = requests.get(url, headers=headers)
        content = BytesIO(r.content)
        content_type = r.headers.get("Content-Type", "").lower()
        url_lower = url.lower()

        if url_lower.endswith(".pdf") or "pdf" in content_type:
            return "\n".join(page.get_text() for page in fitz.open(stream=content, filetype="pdf"))

        elif url_lower.endswith(".docx") or "word" in content_type:
            import docx
            doc = docx.Document(content)
            return "\n".join(p.text for p in doc.paragraphs)

        elif url_lower.endswith(".txt") or "text/plain" in content_type:
            return content.read().decode('utf-8', errors='ignore')

        elif url_lower.endswith(('.png', '.jpg', '.jpeg')) or "image" in content_type:
            from PIL import Image
            import pytesseract
            return pytesseract.image_to_string(Image.open(content)).strip()

        else:
            r.encoding = 'utf-8'
            soup = BeautifulSoup(r.text, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer', 'noscript']):
                tag.decompose()
            return re.sub(r'\n{2,}', '\n', soup.get_text(separator='\n', strip=True))

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return ""


def build_vectordb(main_url, links=None):
    if "drive.google.com/drive/folders/" in main_url:
        links = extract_links_from_drive_folder(main_url)
    elif links is None:
        links = extract_links_from_any_url(main_url)

    # 🔧 Use folder ID or domain for DB name
    if "drive.google.com" in main_url:
        match = re.search(r'/folders/([\w-]+)|id=([\w-]+)', main_url)
        name = f"drive_{match.group(1) or match.group(2)}" if match else "drive_google_com"
    else:
        name = urlparse(main_url).netloc.replace('.', '_')

    path = f"vectordb/{name}_vectordb"
    os.makedirs(path, exist_ok=True)

    docs = []
    for i, link in enumerate(links):
        text = extract_text(link)
        print(f"🔗 {i+1}/{len(links)} {link} ➜ {len(text)} chars")
        if text:
            fname = link.split('/')[-1].split('?')[0]
            docs.append(Document(page_content=text, metadata={"source": link, "filename": fname}))

    if not docs:
        print("⚠️ No valid content found to create vector DB.")
        return None

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectordb = Chroma.from_documents(docs, embeddings, persist_directory=path)
    print(f"✅ Vector DB created at: {path}")
    return path