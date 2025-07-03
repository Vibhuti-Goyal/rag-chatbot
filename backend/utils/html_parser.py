from bs4 import BeautifulSoup
import requests
import re
from urllib.parse import urljoin

def extract_links_from_text(text, is_url=False):
    links = set()

    if is_url:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; LinkExtractorBot/1.0)"
            }
            response = requests.get(text, timeout=60, headers=headers)
            soup = BeautifulSoup(response.text, "html.parser")
            for a_tag in soup.find_all("a", href=True):
                href = a_tag['href']
                if href.startswith(("mailto:", "tel:", "javascript:")):
                    continue
                full_url = urljoin(text, href)
                links.add(full_url)
        except Exception as e:
            print(f"❌ Failed to fetch website: {text}. Reason: {str(e)}")
    else:
        matches = re.findall(r'https?://[^\s<>")]+|www\.[^\s<>")]+', text)
        cleaned = [link.rstrip('.,);') for link in matches]
        links.update(cleaned)

    return list(links)
