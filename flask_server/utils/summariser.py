import os
import requests
from dotenv import load_dotenv
load_dotenv()

def summarize_with_groq(text):
    text = text.strip()
    if not text:
        return "⚠️ No content to summarize."

    prompt = (
        "You are a helpful AI assistant. Your task is to summarize the following content in a well-organized and detailed manner.\n\n"
        "Please follow this structure:\n"
        "1. Start with a **brief paragraph summary** explaining the overall topic.\n"
        "2. Then provide a **detailed bullet-point breakdown** of key facts, data points, and takeaways.\n"
        "3. If applicable, format structured data into a **Markdown-style table**, using proper syntax (no trailing pipes).\n"
        "4. Keep the language formal and concise, suitable for readers who haven't seen the original article.\n"
        "5. Maintain the order of importance and relevance as found in the content.\n\n"
        f"Here is the content to summarize:\n\n{text[:4000]}\n\n"
        "Now generate the structured summary following the above format."
    )

    try:
        response = requests.post(
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
        response.raise_for_status()
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "⚠️ No summary returned.")

    except Exception as e:
        return f"❌ Failed to summarize: {e}"
