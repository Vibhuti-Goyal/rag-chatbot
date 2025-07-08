import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


def extract_links_from_any_url(url):
    try:
        # Check if URL is a direct file link (PDF, DOCX, TXT, or image)
        if url.lower().endswith(('.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
            return [url]
        
        # Check if it's a Google Drive file link
        if "drive.google.com" in url and ("/file/d/" in url or "/d/" in url):
            return [url]
        
        # For other URLs, try to extract links
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        r.raise_for_status()
        ct = r.headers.get('Content-Type', '').lower()

        # Check content type for direct files
        if any(file_type in ct for file_type in ['pdf', 'word', 'text/plain', 'image/']):
            return [url]

        # If it's an HTML page, extract links
        soup = BeautifulSoup(r.text, 'html.parser')
        links = [urljoin(url, a['href']) for a in soup.find_all('a', href=True)]
        
        # Filter and return unique links
        filtered_links = [link for link in links if link.startswith('http')]
        unique_links = list(dict.fromkeys(filtered_links))[:50]
        
        # If no links found, return the original URL
        return unique_links if unique_links else [url]

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return [url]  # Return original URL if link extraction fails