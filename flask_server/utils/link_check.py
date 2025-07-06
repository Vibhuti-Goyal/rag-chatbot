import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_links_from_any_url(url):
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        r.raise_for_status()
        ct = r.headers.get('Content-Type', '').lower()

        if url.lower().endswith(('.pdf', '.docx', '.txt')) or 'pdf' in ct or 'word' in ct:
            return [url]

        soup = BeautifulSoup(r.text, 'html.parser')
        links = [urljoin(url, a['href']) for a in soup.find_all('a', href=True)]
        
        # ✅ Return only top 50 unique links
        filtered_links = [link for link in links if link.startswith('http')]
        return list(dict.fromkeys(filtered_links))[:50]

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return [url]  # Return original URL if link extraction fails

'''def extract_links_from_any_url(url):
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        r.raise_for_status()
        ct = r.headers.get('Content-Type', '').lower()

        if url.lower().endswith(('.pdf', '.docx', '.txt')) or 'pdf' in ct or 'word' in ct:
            return [url]

        soup = BeautifulSoup(r.text, 'html.parser')
        links = [urljoin(url, a['href']) for a in soup.find_all('a', href=True)]
        return list({link for link in links if link.startswith('http')})

    except Exception as e:
        print(f"❌ {url} failed: {e}")
        return [url]  # Return original URL if link extraction fails'''

'''def extract_links_from_drive_folder(folder_url, visited=None):
    if visited is None:
        visited = set()

    if folder_url in visited:
        return []

    visited.add(folder_url)
    headers = {'User-Agent': 'Mozilla/5.0'}
    links = set()
    subfolders = set()

    try:
        r = requests.get(folder_url, headers=headers, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        scripts = soup.find_all('script')

        for script in scripts:
            # 🧾 Extract file links
            if 'drive.google.com/file/d/' in script.text:
                found = re.findall(r'https://drive.google.com/file/d/[\w-]+', script.text)
                links.update(f + "/view?usp=sharing" for f in found)

            # 📁 Extract subfolder links
            if 'drive.google.com/drive/folders/' in script.text:
                found_subs = re.findall(r'https://drive.google.com/drive/folders/[\w-]+', script.text)
                subfolders.update(found_subs)

    except Exception as e:
        print(f"❌ Failed to extract from {folder_url}: {e}")

    # 🔁 Recurse into subfolders
    for sf in subfolders:
        links.update(extract_links_from_drive_folder(sf, visited))

    return list(links)'''
