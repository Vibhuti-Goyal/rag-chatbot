# utils/drive_utils.py

import requests
import re

def convert_drive_url_to_direct(url):
    file_id = None
    if "/file/d/" in url:
        file_id = url.split("/file/d/")[1].split("/")[0]
    elif "open?id=" in url:
        file_id = url.split("open?id=")[1].split("&")[0]
    elif "uc?id=" in url:
        file_id = url.split("uc?id=")[1].split("&")[0]

    if file_id:
        return f"https://drive.google.com/uc?export=download&id={file_id}"
    return url

def fetch_drive_file_text(url):
    try:
        direct_url = convert_drive_url_to_direct(url)
        response = requests.get(direct_url)
        if response.status_code == 200:
            return response.text
        else:
            print(f"❌ Download failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error downloading file: {e}")
        return None
