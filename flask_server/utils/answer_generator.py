import os, requests
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

def generate_answer(query, db_paths, memory=None, history=""):
    emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    context = ""

    for path in db_paths:
        try:
            db = Chroma(persist_directory=path, embedding_function=emb)
            docs = db.similarity_search(query, k=3)
            if docs:
                context += f"\n\n# Source: {os.path.basename(path)}\n"
                context += "\n\n".join(d.page_content for d in docs)
        except Exception as e:
            print(f"❌ DB error in {path}: {e}")

    if not context.strip():
        return "⚠️ No relevant content found."

    if memory:
        chat = memory.load_memory_variables({}).get("chat_history", [])
        for m in chat:
            who = "User" if m.type == "human" else "AI"
            history += f"{who}: {m.content.strip()}\n"

    prompt = f"""{history.strip()}

You are a smart and structured assistant. You are given helpful **context** extracted from documents using vector search.

Your job is to **ONLY** use the provided context to answer the user's question. 
If the context does **not contain** enough information, say:
**"No relevant information found to answer the question."**

### Instructions:
- Use **paragraphs** for explanation or storytelling.
- Use **bullet points** for structured details.
- Use **markdown tables** if useful for comparison.
- Do NOT use outside knowledge or make assumptions.
- DO NOT answer if context is missing or unrelated.

### Context:
{context}

### User Question:
{query}

### Your Response:
"""

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            },
            timeout=30
        )
        return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print("❌ Groq error:", e)
        return f"❌ Groq failed: {e}"
