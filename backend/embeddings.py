import os
from google import genai


def generate_embedding(text):
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key or not text:
        return None
    client = genai.Client(api_key=api_key)
    try:
        result = client.models.embed_content(
            model='gemini-embedding-001',
            contents=text[:8000],
        )
        return result.embeddings[0].values
    except Exception:
        return None


def cosine_similarity(a, b):
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
