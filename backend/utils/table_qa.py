import pandas as pd
import os
import requests
from dotenv import load_dotenv
import numpy as np

load_dotenv()

def answer_question_from_table(df: pd.DataFrame, question: str):
    """
    Answer questions from table data using intelligent analysis and LLM.
    Handles large datasets efficiently.
    """
    if df is None or df.empty:
        return "❌ No table data available."
    
    if not question or not question.strip():
        return "❌ Please provide a question about the table."
    
    try:
        print(f"📊 Analyzing table: {df.shape} for question: {question}")
        
        # Clean the dataframe
        df_clean = df.copy()
        df_clean = df_clean.fillna('')
        df_clean.columns = df_clean.columns.astype(str)
        
        # Get comprehensive table analysis
        analysis = get_comprehensive_table_analysis(df_clean, question)
        
        # Use LLM to answer based on analysis
        answer = get_llm_table_answer(analysis, question)
        
        return answer
        
    except Exception as e:
        print(f"❌ Error processing table question: {e}")
        return f"❌ Error analyzing table: {str(e)}"

def get_comprehensive_table_analysis(df, question):
    """
    Get comprehensive analysis of the table relevant to the question.
    """
    analysis = []
    
    # Basic info
    analysis.append("📊 TABLE OVERVIEW:")
    analysis.append(f"- Rows: {df.shape[0]}, Columns: {df.shape[1]}")
    analysis.append(f"- Columns: {', '.join(df.columns.tolist())}\n")
    
    # Show sample data
    sample_size = min(20, len(df))
    analysis.append(f"📄 SAMPLE DATA (first {sample_size} rows):")
    analysis.append(df.head(sample_size).to_string(index=True, max_cols=None))
    
    # Explicitly include last row
    last_row_index = df.index[-1]
    analysis.append(f"\n📄 LAST ROW (index {last_row_index}):")
    analysis.append(df.tail(1).to_string(index=True, max_cols=None))
    analysis.append("")
    
    # Numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if numeric_cols:
        analysis.append("📈 NUMERIC STATISTICS:")
        for col in numeric_cols:
            stats = df[col].describe()
            analysis.append(f"{col}: count={stats['count']}, mean={stats['mean']:.2f}, min={stats['min']}, max={stats['max']}")
        analysis.append("")
    
    # Categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    if categorical_cols:
        analysis.append("🔠 CATEGORICAL COLUMNS:")
        for col in categorical_cols[:5]:
            unique_count = df[col].nunique()
            if unique_count <= 20:
                value_counts = df[col].value_counts().head(10)
                analysis.append(f"{col} ({unique_count} unique): {dict(value_counts)}")
            else:
                top_values = df[col].value_counts().head(5)
                analysis.append(f"{col} ({unique_count} unique, top 5): {dict(top_values)}")
        analysis.append("")
    
    # Relevant columns based on question
    question_lower = question.lower()
    relevant_cols = []
    for col in df.columns:
        if any(word in col.lower() for word in question_lower.split()):
            relevant_cols.append(col)
    
    if relevant_cols:
        analysis.append("🔍 RELEVANT COLUMNS BASED ON QUESTION:")
        for col in relevant_cols:
            if col in numeric_cols:
                analysis.append(f"{col}:\n{df[col].describe().to_string()}")
            else:
                analysis.append(f"{col}:\n{df[col].value_counts().head(10).to_string()}")
        analysis.append("")
    
    # Extra logic for common ops
    if any(word in question_lower for word in ['sum', 'total', 'add']):
        analysis.append("➕ SUM CALCULATIONS:")
        for col in numeric_cols:
            analysis.append(f"Sum of {col}: {df[col].sum()}")
        analysis.append("")
    
    if any(word in question_lower for word in ['average', 'mean']):
        analysis.append("📏 AVERAGE CALCULATIONS:")
        for col in numeric_cols:
            analysis.append(f"Average of {col}: {df[col].mean():.2f}")
        analysis.append("")
    
    if any(word in question_lower for word in ['max', 'maximum', 'highest']):
        analysis.append("🔺 MAXIMUM VALUES:")
        for col in numeric_cols:
            max_val = df[col].max()
            max_idx = df[col].idxmax()
            analysis.append(f"Max {col}: {max_val} (at row {max_idx})")
        analysis.append("")
    
    if any(word in question_lower for word in ['min', 'minimum', 'lowest']):
        analysis.append("🔻 MINIMUM VALUES:")
        for col in numeric_cols:
            min_val = df[col].min()
            min_idx = df[col].idxmin()
            analysis.append(f"Min {col}: {min_val} (at row {min_idx})")
        analysis.append("")
    
    # Basic keyword search in text columns
    search_terms = [word for word in question_lower.split() 
                    if word not in ['what', 'where', 'how', 'many', 'show', 'find', 'the', 'is', 'are', 'a', 'an']]
    
    if search_terms:
        analysis.append("🔎 SEARCH RESULTS:")
        for col in df.columns:
            if df[col].dtype == 'object':
                matches = df[col].str.contains('|'.join(search_terms), case=False, na=False)
                if matches.any():
                    analysis.append(f"Matches in {col}:")
                    matching_rows = df[matches]
                    if len(matching_rows) > 5:
                        analysis.append(matching_rows.head(5).to_string(index=True, max_cols=None))
                        analysis.append(f"...and {len(matching_rows)-5} more rows matched.\n")
                    else:
                        analysis.append(matching_rows.to_string(index=True, max_cols=None))
        analysis.append("")
    
    return "\n".join(analysis)

def get_llm_table_answer(context, question):
    """
    Calls LLM (e.g., via Groq API) to answer the question using provided table analysis context.
    """
    try:
        prompt = f"""You are a smart data assistant helping the user understand a table.

Analyze the following table overview and answer the user's question using specific references to the data.

Table Analysis:
{context}

Question: {question}

Answer:"""

        headers = {
            "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 1000
        }

        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()

    except Exception as e:
        print(f"❌ LLM error: {e}")
        return "❌ Failed to generate an answer from the table context."
