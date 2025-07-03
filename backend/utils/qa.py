import os
import requests
from dotenv import load_dotenv
import re
load_dotenv()

def generate_answer(question, relevant_chunks):
    """
    Generate answer using RAG-style prompting with intelligent chunk selection and context building
    """
    MAX_CHARS = 8000  # Increased context size for comprehensive answers
    
    # Analyze the question to determine what kind of information is being requested
    question_analysis = analyze_question_intent(question)
    
    # Smart chunk selection and ordering based on question intent
    selected_chunks = select_and_order_chunks(relevant_chunks, question_analysis)
    
    # Build context from selected chunks
    context = build_context(selected_chunks, MAX_CHARS, question_analysis)
    
    # Generate appropriate prompt based on question type
    prompt = generate_smart_prompt(question, context, question_analysis)

    headers = {
        "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-8b-8192",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,  # Lower temperature for more consistent answers
        "max_tokens": 2000   # Increased for comprehensive answers
    }

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        res.raise_for_status()
        answer = res.json()["choices"][0]["message"]["content"].strip()
        
        # Post-process answer to enhance with extracted links and formatting
        answer = post_process_answer(answer, context, question_analysis)
        
        return answer
    except Exception as e:
        return f"Error generating answer: {str(e)}"

def analyze_question_intent(question):
    """
    Analyze the question to understand what type of information is being requested
    """
    question_lower = question.lower()
    
    intent = {
        "type": "general",
        "scope": "specific",
        "keywords": [],
        "requires_comprehensive": False,
        "wants_links": False,
        "wants_details": False,
        "categories": []
    }
    
    # Determine question scope
    comprehensive_indicators = ["all", "every", "complete", "entire", "full", "comprehensive", "total", "everything"]
    if any(indicator in question_lower for indicator in comprehensive_indicators):
        intent["scope"] = "comprehensive"
        intent["requires_comprehensive"] = True
    
    # Detect if question asks for links
    link_indicators = ["link", "url", "website", "github", "repository", "source"]
    if any(indicator in question_lower for indicator in link_indicators):
        intent["wants_links"] = True
    
    # Detect if question asks for details
    detail_indicators = ["detail", "explain", "describe", "how", "what", "elaborate", "specific"]
    if any(indicator in question_lower for indicator in detail_indicators):
        intent["wants_details"] = True
    
    # Categorize question type
    question_types = {
        "project": ["project", "built", "developed", "created", "implemented", "designed", "system", "application"],
        "technical": ["technology", "tech", "language", "framework", "tool", "skill", "programming"],
        "experience": ["experience", "work", "job", "role", "position", "career"],
        "education": ["education", "degree", "university", "college", "study", "course"],
        "summary": ["summary", "overview", "about", "introduction", "background"],
        "contact": ["contact", "email", "phone", "reach", "linkedin", "github"]
    }
    
    for category, keywords in question_types.items():
        if any(keyword in question_lower for keyword in keywords):
            intent["categories"].append(category)
            intent["keywords"].extend([kw for kw in keywords if kw in question_lower])
    
    # Set primary type
    if intent["categories"]:
        intent["type"] = intent["categories"][0]
    
    return intent

def select_and_order_chunks(chunks, question_analysis):
    """
    Intelligently select and order chunks based on question analysis
    """
    if not chunks:
        return []
    
    # Score each chunk based on relevance to the question
    scored_chunks = []
    
    for chunk in chunks:
        score = calculate_chunk_relevance(chunk, question_analysis)
        scored_chunks.append((chunk, score))
    
    # Sort by relevance score (highest first)
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    
    # Select top chunks, but ensure we get comprehensive coverage if needed
    if question_analysis["requires_comprehensive"]:
        # For comprehensive questions, include more chunks and prioritize summary chunks
        selected = []
        summary_chunks = [chunk for chunk in chunks if chunk.metadata.get("chunk_type") == "full_summary"]
        regular_chunks = [chunk for chunk in chunks if chunk.metadata.get("chunk_type") != "full_summary"]
        
        # Add summary chunks first
        selected.extend(summary_chunks)
        # Add top-scored regular chunks
        selected.extend([chunk for chunk, score in scored_chunks[:10] if chunk not in selected])
        
        return selected
    else:
        # For specific questions, return top 5-7 most relevant chunks
        return [chunk for chunk, score in scored_chunks[:7]]

def calculate_chunk_relevance(chunk, question_analysis):
    """
    Calculate relevance score for a chunk based on question analysis
    """
    score = 0
    content = chunk.page_content.lower()
    metadata = chunk.metadata
    
    # Base score from metadata
    if metadata.get("chunk_type") == "full_summary":
        score += 10 if question_analysis["requires_comprehensive"] else 2
    
    # Category matching
    for category in question_analysis["categories"]:
        if category in metadata.get("categories", []):
            score += 15
        if metadata.get(f"{category}_score", 0) > 0:
            score += metadata.get(f"{category}_score", 0) * 3
    
    # Keyword matching in content
    for keyword in question_analysis["keywords"]:
        count = content.count(keyword)
        score += count * 5
    
    # Link bonus if question wants links
    if question_analysis["wants_links"] and metadata.get("has_links"):
        score += 20
    
    # Length bonus for detailed questions
    if question_analysis["wants_details"]:
        score += min(len(chunk.page_content) / 100, 10)
    
    return score

def build_context(chunks, max_chars, question_analysis):
    """
    Build context string from selected chunks with smart truncation
    """
    context_parts = []
    total_chars = 0
    
    for chunk in chunks:
        content = chunk.page_content
        
        # Add metadata context if it helps
        if chunk.metadata.get("has_links") and question_analysis["wants_links"]:
            urls = chunk.metadata.get("urls", [])
            if urls:
                content += f"\n\n[Links found: {', '.join(urls)}]"
        
        if total_chars + len(content) > max_chars:
            # Smart truncation - try to keep complete sentences
            remaining = max_chars - total_chars
            if remaining > 200:  # Only add if meaningful space left
                truncated = smart_truncate(content, remaining)
                context_parts.append(truncated)
            break
        
        context_parts.append(content)
        total_chars += len(content)
    
    return "\n\n---\n\n".join(context_parts)

def smart_truncate(text, max_length):
    """
    Truncate text at sentence boundaries when possible
    """
    if len(text) <= max_length:
        return text
    
    # Try to truncate at sentence boundary
    truncated = text[:max_length]
    last_period = truncated.rfind('.')
    last_newline = truncated.rfind('\n')
    
    boundary = max(last_period, last_newline)
    if boundary > max_length * 0.7:  # Only use boundary if it's not too early
        return text[:boundary + 1] + "..."
    else:
        return truncated + "..."

def generate_smart_prompt(question, context, question_analysis):
    """
    Generate appropriate prompt based on question analysis
    """
    if question_analysis["requires_comprehensive"]:
        prompt = f"""You are analyzing a document to provide a comprehensive answer. The user wants complete information about their query.

Please provide a thorough answer that covers ALL relevant information found in the context. Be systematic and organized in your response.

Document Context:
{context}

Question: {question}

Please provide a comprehensive answer covering all relevant information:"""
    
    elif question_analysis["wants_links"]:
        prompt = f"""You are analyzing a document to extract specific information including any links or URLs mentioned.

Please provide a detailed answer and make sure to include any links, URLs, or references found in the context.

Document Context:
{context}

Question: {question}

Answer (include any links found):"""
    
    elif question_analysis["wants_details"]:
        prompt = f"""You are analyzing a document to provide detailed explanations.

Please provide a thorough, detailed answer with specific information, examples, and explanations based on the context.

Document Context:
{context}

Question: {question}

Detailed Answer:"""
    
    else:
        prompt = f"""You are a helpful assistant. Use the following context to answer the question accurately and concisely.

Context:
{context}

Question: {question}

Answer:"""
    
    return prompt

def post_process_answer(answer, context, question_analysis):
    """
    Post-process the answer to enhance formatting and add extracted information
    """
    try:
        # Extract and format any URLs found in context
        if question_analysis["wants_links"] or "link" in question_analysis["keywords"]:
            url_pattern = r'https?://[^\s<>"]+|www\.[^\s<>"]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s<>"]*'
            urls = list(set(re.findall(url_pattern, context)))
            
            if urls and "http" not in answer.lower() and "www" not in answer.lower():
                answer += "\n\n**Links found in document:**\n"
                for i, url in enumerate(urls, 1):
                    answer += f"{i}. {url}\n"
        
        return answer
    except Exception as e:
        print(f"Error in post-processing: {e}")
        return answer