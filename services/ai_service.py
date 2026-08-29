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
You are an intelligent AI tutor designed for school and college students.

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


def generate_quiz_ai(subject: str, topic: str, difficulty: str = "Medium", question_type: str = "MCQ", num_questions: int = 3) -> dict:
    """
    Generate structured quiz questions using Groq AI SDK.
    Returns a dictionary matching { "questions": [...] }.
    """
    import json
    import re

    type_desc = "fill-in-the-blank style (where each question has a blank ___ for the answer)" if question_type == "Fill in the Blank" else "multiple choice"

    prompt = f"""Generate a {num_questions}-question {type_desc} quiz on the subject "{subject}" and topic "{topic}" with difficulty "{difficulty}".
Return the response strictly as a JSON object matching this schema:
{{
  "questions": [
    {{
      "q": "Question text?",
      "options": ["A) option A", "B) option B", "C) option C", "D) option D"],
      "correct": 0,
      "explain": "Brief 1-sentence explanation"
    }}
  ]
}}
Ensure there are exactly {num_questions} questions. Keep explanations under 15 words. The 'correct' field must be the integer index (0, 1, 2, or 3) of the correct answer in options."""

    try:
        client = Groq(api_key=Config.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI quiz generator. Output ONLY a raw, complete JSON object matching the requested schema without any markdown code fences or conversational text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_completion_tokens=1500
        )
        raw_text = completion.choices[0].message.content.strip()

        # Robust JSON extraction
        parsed = None
        first_brace = raw_text.find('{')
        last_brace = raw_text.rfind('}')
        if first_brace != -1 and last_brace > first_brace:
            json_candidate = raw_text[first_brace:last_brace + 1]
            try:
                parsed = json.loads(json_candidate)
            except Exception as e:
                print(f"JSON candidate parse error: {e}", file=sys.stderr)

        if not parsed:
            try:
                parsed = json.loads(raw_text)
            except Exception:
                pass

        if isinstance(parsed, dict) and "questions" in parsed and isinstance(parsed["questions"], list) and len(parsed["questions"]) > 0:
            return {
                "success": True,
                "questions": parsed["questions"],
                "subject": subject,
                "topic": topic,
                "difficulty": difficulty
            }
        else:
            raise ValueError("Response JSON does not contain valid 'questions' array.")

    except Exception as e:
        print(f"Error generating quiz AI: {e}", file=sys.stderr)
        # Safe fallback quiz so frontend never crashes
        fallback_questions = [
            {
                "q": f"Basic Question 1 on {topic} ({subject})",
                "options": [f"A) Concept A of {topic}", f"B) Concept B of {topic}", f"C) Concept C of {topic}", f"D) Concept D of {topic}"],
                "correct": 0,
                "explain": f"This is a fundamental concept in {topic}."
            },
            {
                "q": f"Basic Question 2 on {topic} ({subject})",
                "options": [f"A) Option 1", f"B) Option 2", f"C) Option 3", f"D) Option 4"],
                "correct": 1,
                "explain": f"Option 2 correctly answers the problem for {topic}."
            },
            {
                "q": f"Basic Question 3 on {topic} ({subject})",
                "options": [f"A) Choice A", f"B) Choice B", f"C) Choice C", f"D) Choice D"],
                "correct": 2,
                "explain": f"Choice C is the correct answer."
            }
        ]
        return {
            "success": True,
            "questions": fallback_questions,
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
            "warning": f"Generated using fallback due to AI model format issue: {str(e)}"
        }

