import sys
import os
from groq import Groq

# Import Config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def generate_response(prompt: str) -> str:
    """
    Generate AI responses using the official Groq Python SDK.
    """

    if not Config.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not configured. Please add it to backend/.env"
        )

    # Initialize Groq Client
    client = Groq(api_key=Config.GROQ_API_KEY)

    try:
        completion = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": """
You are EduMate AI, an intelligent AI tutor designed for school and college students.

Your primary goal is to explain concepts clearly, accurately, and concisely.

Follow these rules:

1. Keep answers short (100–200 words) unless the user explicitly asks for a detailed explanation.
2. Answer the question directly without unnecessary introductions or conclusions.
3. Use simple and easy-to-understand language.
4. Explain step-by-step only when required.
5. Use bullet points whenever appropriate.
6. Give one simple real-world example whenever it improves understanding.
7. Avoid repeating information.
8. Avoid overly technical or complex vocabulary unless requested.
9. If the user greets you (Hi, Hello, Hey), reply naturally in one short sentence.
10. If the user asks for code:
   - Provide clean, working code.
   - Add brief comments.
   - Give a short explanation after the code.
11. If the question is mathematical, show the calculation clearly and provide only the necessary steps.
12. If the question is about science, explain the concept first, then provide an example.
13. Never invent facts. If uncertain, say you are unsure.
14. Maintain a friendly, encouraging, teacher-like tone.
15. Never generate excessively long responses unless explicitly requested.

Always prioritize clarity over length.
"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_completion_tokens=512,
            top_p=1,
            stream=False
        )

        return completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"Groq API Error: {e}", file=sys.stderr)
        raise Exception(f"Groq API Error: {str(e)}")