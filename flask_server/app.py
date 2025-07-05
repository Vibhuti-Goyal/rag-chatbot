from flask import Flask, request, jsonify
from utils.link_check import extract_links_from_any_url
from utils.vector_store import build_vectordb, extract_text
from utils.summariser import summarize_with_groq
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

@app.route('/get-links', methods=['POST'])
def get_links():
    url = request.get_json().get('url')
    if not url: return jsonify({'error': 'URL is required'}), 400
    
    links = extract_links_from_any_url(url)
    return jsonify({'total_links': len(links), 'links': links})

@app.route('/create-vectordb', methods=['POST'])
def create_vectordb():
    url = request.get_json().get('url')
    if not url: return jsonify({'error': 'URL is required'}), 400

    links = extract_links_from_any_url(url)
    if not links: return jsonify({'error': 'No links found'}), 404

    path = build_vectordb(url, links)
    if not path: return jsonify({'error': 'Failed to create vector DB'}), 500

    raw_text = extract_text(url)
    summary = summarize_with_groq(raw_text[:4000])
    print("\n📄 SUMMARY:\n", summary)

    return jsonify({'total_links': len(links), 'db_path': path, 'summary': summary})

if __name__ == '__main__':
    app.run(debug=True)