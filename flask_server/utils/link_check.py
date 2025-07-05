import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_links_from_any_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type', '').lower()
        url_lower = url.lower() 

        # If it's a direct PDF/DOCX file, return as-is
        if url_lower.endswith(('.pdf', '.docx')) or 'application/pdf' in content_type or 'wordprocessingml' in content_type:
            return [url]

        # Otherwise, parse HTML and extract links
        soup = BeautifulSoup(response.text, 'html.parser')
        links = [urljoin(url, tag['href']) for tag in soup.find_all('a', href=True)]
        return list(set(links))

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return []
