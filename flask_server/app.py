from flask import Flask, request, jsonify
from dotenv import load_dotenv
from utils.link_check import extract_links_from_any_url
from utils.vector_store import build_vectordb,clean_text_for_summary
from utils.summariser import summarize_with_groq
from utils.answer_generator import generate_answer

load_dotenv()
app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        'message': 'Welcome to the Flask VectorDB API'
    })


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
        

        cleaned = clean_text_for_summary(full_text)
        summary = (
            summarize_with_groq(cleaned[:6000])
            if cleaned and len(cleaned.strip()) > 50
            else "⚠️ No usable text extracted from the document for summarization."
        )


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
        summary = data.get("summary")

        answer = generate_answer(data.get("query"), data.get("db_paths"),summary=summary, memory=None)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/text', methods=['POST'])
def summarize():
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "⚠️ No text provided for summarization."}), 400

        summary = summarize_with_groq(text)
        return jsonify({"summary": summary})

    except Exception as e:
        print("❌ Summarization error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
