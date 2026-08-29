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


def generate_storyboard(topic: str, grade: str = "6th Standard", slide_count: int = 5) -> dict:
    """
    Generate an educational storyboard in a SINGLE Groq LLM API request.
    Identifies learning objectives, step-by-step concepts, subtitles, and image prompts.
    Returns: { "success": bool, "storyboard": { "title": ..., "topic": ..., "grade": ..., "shared_style_context": ..., "slides": [...] } }
    """
    import json
    import re

    if not topic or not topic.strip():
        return {
            "success": False,
            "message": "Topic is required to generate a storyboard."
        }

    try:
        count = int(slide_count)
        if count not in (4, 5):
            count = 5
    except (ValueError, TypeError):
        count = 5

    grade_str = str(grade).strip()
    if not grade_str.lower().endswith("standard") and not grade_str.lower().endswith("grade"):
        grade_str = f"{grade_str} Standard"

    grade_num = 6
    numbers = re.findall(r'\d+', grade_str)
    if numbers:
        try:
            grade_num = int(numbers[0])
        except ValueError:
            pass

    if grade_num <= 3:
        grade_guideline = "Use very simple vocabulary, short sentences, playful analogies, and concrete everyday examples suitable for primary students."
    elif grade_num <= 8:
        grade_guideline = "Use engaging descriptive language, clear cause-and-effect relationships, and basic scientific/academic terminology suited for middle school students."
    else:
        grade_guideline = "Use precise scientific/academic terminology, deeper conceptual mechanisms, accurate cause-and-effect analysis, and real-world applications suited for high school students."

    prompt = f"""You are an expert school science teacher and educational storyboard designer.
Create a complete educational storyboard explaining "{topic}" for a student in "{grade_str}".

The story MUST contain EXACTLY {count} sequential slides progressing logically:
Slide 1: Beginning / Real-world context
Slide 2..{count-1}: Step-by-step conceptual development & cause-and-effect relationships
Slide {count}: Conclusion / Conceptual summary & real-world connection

Grade Level Adaptation ({grade_str}):
{grade_guideline}

STRICT REQUIREMENTS FOR IMAGE PROMPTS ("image_prompt"):
1. DO NOT include subtitles, paragraphs, titles, words, letters, labels, or UI text inside "image_prompt".
2. "image_prompt" MUST describe purely visual, physical elements suitable for an text-to-image AI model (e.g. "Sun shining on a quiet blue lake, water surface showing mist rising").
3. Provide a unified "shared_style_context" string that establishes a visually consistent textbook illustration style across all slides (e.g. "Clean modern educational textbook illustration, scientifically accurate, clear composition, soft natural lighting").

Return strictly a JSON object matching this schema:
{{
  "title": "Understanding {topic}",
  "topic": "{topic}",
  "grade": "{grade_str}",
  "learning_objective": "1-sentence core learning objective",
  "shared_style_context": "Clean modern educational textbook illustration, scientifically accurate, suitable for {grade_str} students, consistent style",
  "slides": [
    {{
      "slide_number": 1,
      "concept": "Core concept of step 1",
      "subtitle": "Clear 1-2 sentence educational subtitle for step 1",
      "image_prompt": "Purely visual description of scene 1 without any text or labels"
    }}
  ]
}}
Ensure there are EXACTLY {count} slides in the "slides" array with sequential slide_number (1 to {count})."""

    def call_groq_llm(user_prompt: str) -> str:
        client = Groq(api_key=Config.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI educational content developer and storyboard designer. Output ONLY a raw, complete JSON object matching the requested schema without any markdown code fences or conversational text."
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.2,
            max_completion_tokens=2000
        )
        return completion.choices[0].message.content.strip()

    def parse_storyboard_json(raw_text: str) -> dict:
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
        return parsed

    try:
        raw_text = call_groq_llm(prompt)
        parsed = parse_storyboard_json(raw_text)

        # Validate parsed storyboard schema
        if not (isinstance(parsed, dict) and "slides" in parsed and isinstance(parsed["slides"], list) and len(parsed["slides"]) == count):
            print("Initial storyboard validation failed. Performing 1 strict retry...", file=sys.stderr)
            retry_prompt = prompt + "\n\nCRITICAL: Your previous response failed schema validation. Return strictly JSON with exactly " + str(count) + " items in 'slides'."
            raw_text = call_groq_llm(retry_prompt)
            parsed = parse_storyboard_json(raw_text)

        if isinstance(parsed, dict) and "slides" in parsed and isinstance(parsed["slides"], list) and len(parsed["slides"]) > 0:
            # Ensure sequential slide numbering and mandatory fields
            validated_slides = []
            for idx, slide in enumerate(parsed["slides"], 1):
                validated_slides.append({
                    "slide_number": idx,
                    "concept": slide.get("concept", f"Step {idx} of {topic}"),
                    "subtitle": slide.get("subtitle", f"Step {idx}: Learning about {topic}.").strip(),
                    "image_prompt": slide.get("image_prompt") or slide.get("visual_prompt") or f"Educational scene illustrating {topic} step {idx}"
                })

            storyboard = {
                "title": parsed.get("title", f"Understanding {topic}"),
                "topic": topic,
                "grade": grade_str,
                "learning_objective": parsed.get("learning_objective", f"Understand the core concepts of {topic}"),
                "shared_style_context": parsed.get("shared_style_context", f"Clean modern educational textbook illustration for {grade_str} students"),
                "slides": validated_slides
            }
            return {
                "success": True,
                "storyboard": storyboard
            }
        else:
            raise ValueError("LLM response did not contain a valid 'slides' array matching required count.")

    except Exception as e:
        print(f"Error generating storyboard AI: {e}", file=sys.stderr)
        # Fallback storyboard
        fallback_slides = []
        for i in range(1, count + 1):
            fallback_slides.append({
                "slide_number": i,
                "concept": f"Fundamental aspect {i} of {topic}",
                "subtitle": f"Step {i}: Learning about {topic} for {grade_str}.",
                "image_prompt": f"Clear educational scene showing {topic} at step {i}."
            })

        return {
            "success": True,
            "storyboard": {
                "title": f"Understanding {topic}",
                "topic": topic,
                "grade": grade_str,
                "learning_objective": f"Learn key steps of {topic}",
                "shared_style_context": f"Clean educational textbook illustration for {grade_str}",
                "slides": fallback_slides
            },
            "warning": f"Generated using fallback structure due to AI format issue: {str(e)}"
        }


# Alias for backward compatibility
generate_image_story_ai = generate_storyboard



