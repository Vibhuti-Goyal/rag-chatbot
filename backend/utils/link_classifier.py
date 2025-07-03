import re
from urllib.parse import urlparse, parse_qs

def classify_link(url):
    """
    Classifies the given URL into:
    - platform: Google Drive, OneDrive, SharePoint, Website, or Unknown
    - type: file or folder (if possible to detect)

    Args:
        url (str): The input URL to classify.

    Returns:
        dict: {
            'platform': 'drive' | 'onedrive' | 'sharepoint' | 'website' | 'unknown',
            'type': 'file' | 'folder' | 'unknown'
        }
    """

    # Parse the URL to extract domain, path, etc.
    parsed_url = urlparse(url)
    netloc = parsed_url.netloc.lower()  # example: 'drive.google.com'

    # --------------------------
    # Step 1: Identify PLATFORM
    # --------------------------

    if "drive.google.com" in netloc:
        platform = "drive"
    elif "sharepoint.com" in netloc:
        platform = "sharepoint"
    elif "1drv.ms" in netloc or "onedrive.live.com" in netloc:
        platform = "onedrive"
    elif parsed_url.scheme in ["http", "https"]:
        # If it's a regular web page (not Drive or OneDrive), treat as website
        platform = "website"
    else:
        platform = "unknown"

    # Convert full URL to lowercase for easier checks
    url_lower = url.lower()

    # --------------------------
    # Step 2: Identify TYPE (File or Folder)
    # --------------------------

    if platform == "drive":
        # Google Drive folder links have "/folders/" in URL
        if "/folders/" in url_lower:
            link_type = "folder"
        # Google Drive file links have "/file/d/" or "id=" for shared links
        elif "/file/d/" in url_lower or "id=" in url_lower:
            link_type = "file"
        else:
            link_type = "unknown"

    elif platform == "onedrive":
        # OneDrive file links often have 'resid=' or 'redir'
        if "redir" in url_lower and "resid=" in url_lower:
            link_type = "file"
        # Folder links often contain only 'cid='
        elif "cid=" in url_lower and "id=" not in url_lower:
            link_type = "folder"
        else:
            link_type = "unknown"

    elif platform == "sharepoint":
        # SharePoint folder links often contain "folder" or "folders"
        if "folder" in url_lower or "folders" in url_lower:
            link_type = "folder"
        # SharePoint file links may contain "file" or document names
        elif "file" in url_lower:
            link_type = "file"
        else:
            # Default to file if it looks like a document
            link_type = "file" if "doc" in url_lower or "pdf" in url_lower else "unknown"

    elif platform == "website":
        # Websites are assumed to be individual files/pages
        link_type = "file"

    else:
        link_type = "unknown"

    return {
        "platform": platform,
        "type": link_type
    }
