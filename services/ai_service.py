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


def generate_story_ai(topic: str, grade_level: str = "6", subject: str = "") -> dict:
    """
    Generate an educational story using Groq AI SDK.
    Returns a dictionary with story contents.
    """
    if not topic or not topic.strip():
        return {
            "error": "clarification_needed",
            "message": "Topic is required to generate a story."
        }

    grade_instruction = ""
    try:
        g = int(grade_level)
        if g <= 3:
            grade_instruction = "Use very simple vocabulary, playful tone, and everyday characters."
        elif g <= 6:
            grade_instruction = "Use engaging descriptive language with basic definitions and adventure narrative."
        elif g <= 8:
            grade_instruction = "Include scientific/subject terms with context and cause/effect relationships."
        else:
            grade_instruction = "Use accurate subject terminology, deeper insights, and real-world applications."
    except ValueError:
        grade_instruction = "Use engaging descriptive language suited for middle school students."

    prompt = f"""Write an engaging, illustrated-style short story explaining "{topic}" for a Grade {grade_level} student.
{grade_instruction}
Break the story into exactly 4 short paragraphs. Use characters, adventure, or analogy to explain the concept.
Separate each paragraph with a line containing only "---".
Do not output any introductory or summary text, just the 4 paragraphs separated by "---"."""

    try:
        story_text = generate_response(prompt)
        return {
            "success": True,
            "title": f"The Story of {topic}",
            "story": story_text,
            "response": story_text,
            "topic": topic,
            "grade_level": grade_level
        }
    except Exception as e:
        print(f"Error generating story AI: {e}", file=sys.stderr)
        raise e