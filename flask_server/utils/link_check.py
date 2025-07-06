import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


def extract_links_from_any_url(url):
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        ct = r.headers.get('Content-Type', '').lower()

        if url.lower().endswith(('.pdf', '.docx')) or 'pdf' in ct or 'word' in ct:
            return [url]

        soup = BeautifulSoup(r.text, 'html.parser')
        links = [urljoin(url, a['href']) for a in soup.find_all('a', href=True)]
        return list({link for link in links if link.startswith('http')})

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return []

def extract_links_from_drive_folder(folder_url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(folder_url, headers=headers)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        scripts = soup.find_all('script')

        links = set()
        for script in scripts:
            if 'drive.google.com/file/d/' in script.text:
                found = re.findall(r'https://drive.google.com/file/d/[\w-]+', script.text)
                for f in found:
                    links.add(f + "/view?usp=sharing")

        return list(links)

    except Exception as e:
        print(f"❌ Failed to extract Drive folder links: {e}")
        return []