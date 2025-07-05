import os
import requests
from dotenv import load_dotenv
load_dotenv()
import re

def summarize_with_groq(text):
    prompt = (
        "You are a helpful AI assistant. Your task is to summarize the following content in a well-organized and detailed manner.\n\n"
        "Please follow this structure:\n"
        "1. Start with a **brief paragraph summary** explaining the overall topic.\n"
        "2. Then provide a **detailed bullet-point breakdown** of key facts, data points, and takeaways.\n"
        "3. If applicable, format structured data into a **Markdown-style table**, using proper syntax (no trailing pipes).\n"
        "4. Keep the language formal and concise, suitable for readers who haven't seen the original article.\n"
        "5. Maintain the order of importance and relevance as found in the content.\n\n"
        f"Here is the content to summarize:\n\n{text}\n\n"
        "Now generate the structured summary following the above format."
    )

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
        }
    )

    return res.json()["choices"][0]["message"]["content"]
