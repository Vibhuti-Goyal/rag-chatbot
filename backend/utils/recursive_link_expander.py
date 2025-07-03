import time
from utils.link_classifier import classify_link
from utils.drive_utils import fetch_drive_files_from_folder, fetch_drive_file_text
from utils.html_parser import extract_links_from_text

# Set to track visited links and avoid reprocessing
visited_links = set()

def expand_and_collect_links(url, depth=0):
    """
    Recursively collects all Google Drive file links starting from a root folder or file URL.
    Ignores non-Google Drive links like websites or other platforms.

    Args:
        url (str): Input file or folder URL
        depth (int): Recursion depth for debug indentation

    Returns:
        list: Flat list of all Google Drive file links discovered
    """
    indent = "  " * depth  # Indentation for print debugging

    if url in visited_links:
        print(f"{indent}🔁 Already visited: {url}")
        return []

    visited_links.add(url)

    # Step 1: Identify the platform and link type
    print(f"{indent}🔍 Classifying: {url}")
    info = classify_link(url)
    platform = info["platform"]
    link_type = info["type"]
    print(f"{indent}📌 Platform: {platform}, Type: {link_type}")

    all_file_links = []

    # Step 2: Handle based on platform
    if platform == "drive":
        if link_type == "folder":
            # Fetch all file links from this folder
            file_links = fetch_drive_files_from_folder(url)
            print(f"{indent}📁 Found {len(file_links)} file(s) in Drive folder.")

            for link in file_links:
                time.sleep(0.5)  # Avoid rate limiting
                nested_links = expand_and_collect_links(link, depth + 1)
                all_file_links.extend(nested_links)

        elif link_type == "file":
            all_file_links.append(url)

            # Try to extract text content and search for embedded links
            file_text = fetch_drive_file_text(url)
            if file_text:
                embedded_links = extract_links_from_text(file_text)
                print(f"{indent}🔗 Found {len(embedded_links)} embedded link(s) in file.")

                for embedded_url in embedded_links:
                    embedded_info = classify_link(embedded_url)
                    if embedded_info["platform"] == "drive":
                        nested_links = expand_and_collect_links(embedded_url, depth + 1)
                        all_file_links.extend(nested_links)
                    else:
                        print(f"{indent}  ⏩ Ignoring non-drive embedded link: {embedded_url}")

        else:
            print(f"{indent}⚠️ Unknown Drive type. Skipping.")

    elif platform == "website":
        # Don't crawl websites to avoid infinite chains
        print(f"{indent}🌐 Skipping website crawling: {url}")

    elif platform in ["onedrive", "sharepoint"]:
        # Support not implemented
        print(f"{indent}📦 Skipping {platform} (not implemented yet).")

    else:
        # Completely unknown platform
        print(f"{indent}❓ Unknown or unsupported platform: {url}")

    return all_file_links
