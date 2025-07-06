from flask import Flask, request, jsonify
from dotenv import load_dotenv
from utils.link_check import extract_links_from_any_url
from utils.vector_store import build_vectordb
from utils.summariser import summarize_with_groq
from utils.answer_generator import generate_answer

load_dotenv()
app = Flask(__name__)

@app.route('/create-vectordb', methods=['POST'])
def create_vectordb():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({'error': 'url is required'}), 400

        links = extract_links_from_any_url(url)
        db_path, full_text = build_vectordb(links)
        
        if not db_path:
            return jsonify({'error': 'Vector DB creation failed'}), 500

        summary = summarize_with_groq(full_text[:6000]) if full_text.strip() else "No content"

        return jsonify({
            'success': True,
            'total_links': len(links),
            'embedding_location': {'type': 'chroma', 'path': db_path, 'namespace': 'auto'},
            'status': 'completed',
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        answer = generate_answer(data.get("query"), data.get("db_paths"), memory=None)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)