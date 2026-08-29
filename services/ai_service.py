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
    Generate an engaging, character-driven educational story using Groq AI SDK.
    Characters (plants, animals, elements, humans) communicate and converse with each other
    to explain the concept in an easily understandable way.
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
            grade_instruction = "Target Grade 1-3: Use very simple vocabulary, playful tone, short sentences, and cute friendly characters (talking animals, baby plants, smiling sun)."
        elif g <= 6:
            grade_instruction = "Target Grade 4-6: Use lively descriptive language, adventurous tone, friendly characters with distinct personalities who converse with each other to explain the mechanism."
        elif g <= 8:
            grade_instruction = "Target Grade 7-8: Balance engaging narrative dialogue with clear scientific/subject cause-and-effect explanations."
        else:
            grade_instruction = "Target High School: Use clever analogies, character dialogues, and accurate scientific principles woven into an engaging storyline."
    except ValueError:
        grade_instruction = "Target Middle School: Use engaging character dialogues, vivid analogies, and easy-to-understand storytelling."

    storyteller_system_prompt = """You are a world-class educational storyteller for students.
Your superpower is turning complex textbook topics into magical, crystal-clear stories where characters (plants, animals, natural forces, atoms, or human friends) talk and communicate with each other.

Storytelling Rules:
1. Always personify key elements or introduce friendly characters (e.g. for Photosynthesis: Leo the Leaf talking to Solly the Sun and Pippy the Raindrop; for Gravity: Sir Apple chatting with Planet Earth).
2. Have characters actively communicate in dialogue quotes ("...") so the concept feels alive and natural.
3. Keep the explanation step-by-step, intuitive, and easy for any student to grasp.
4. Structure the story into exactly 4 sequential chapters/paragraphs.
5. Separate each chapter with a line containing only "---".
6. Do not include markdown headers (# or ##) inside chapters, just the story paragraphs with dialogue.
7. Conclude with a warm resolution where characters or animals/humans benefit from the process."""

    user_prompt = f"""Write an engaging, dialogue-rich educational story explaining "{topic}" for a student ({grade_instruction}).

Make characters talk to each other to explain the process step-by-step!
Separate each of the 4 paragraphs with a line containing only "---"."""

    try:
        client = Groq(api_key=Config.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": storyteller_system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.7,
            max_completion_tokens=1200
        )
        story_text = completion.choices[0].message.content.strip()

        # Generate a catchy title
        title = f"The Story of {topic}"
        first_line = story_text.split('\n')[0].strip().replace('#', '').strip()
        if len(first_line) < 60 and not first_line.startswith('"') and len(story_text.split('---')) > 1:
            if "story" in first_line.lower() or "adventure" in first_line.lower() or "journey" in first_line.lower():
                title = first_line

        return {
            "success": True,
            "title": title,
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
    Generate an educational storyboard with character dialogue and rich storytelling
    in a SINGLE Groq LLM API request.
    Characters converse with each other to explain the concept step-by-step.
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
        grade_guideline = "Target Grade 1-3: Use very simple words, short sentences, and cute friendly characters (talking animals, baby leaves, smiling sun, water drops). Keep scientific jargon minimal and focus on playful conversations."
    elif grade_num <= 8:
        grade_guideline = "Target Grade 4-8: Use lively, descriptive language and friendly characters who converse with each other to explain the step-by-step process. Introduce scientific concepts through clear analogies and dialogues."
    else:
        grade_guideline = "Target High School: Use engaging character dialogues, vivid real-world analogies, and accurate scientific mechanisms woven into an entertaining narrative."

    prompt = f"""You are an award-winning children's science author and educational storyboard designer.
Create a delightfully engaging, character-driven story explaining "{topic}" for a student in "{grade_str}".

CRITICAL STORYTELLING RULE:
Make the topic come alive by introducing friendly characters (e.g. for Photosynthesis: Leo the Leaf talking to Solly the Sun and Pippy the Raindrop, while forest animals enjoy the fresh air; for Water Cycle: Droppy the water droplet talking to the Ocean and Cloud).
Characters MUST TALK TO EACH OTHER using dialogue quotes ("...") to explain the concepts simply and clearly.

The story MUST contain EXACTLY {count} sequential chapters/slides:
Slide 1: Introduction & Character meeting (e.g. waking up, starting the day's quest)
Slide 2..{count-1}: Step-by-step process with characters actively conversing and helping each other
Slide {count}: Celebration & Outcome (how animals, humans, or the ecosystem benefit from this process)

Grade Level Adaptation:
{grade_guideline}

STRICT REQUIREMENTS FOR IMAGE PROMPTS ("image_prompt"):
1. DO NOT include subtitles, paragraphs, titles, words, letters, labels, or UI text inside "image_prompt".
2. "image_prompt" MUST describe purely visual, colorful storybook scenes featuring the characters in action (e.g. "A friendly vibrant green leaf character smiling at a warm golden sun in a sunny meadow, charming storybook digital art").
3. Provide a unified "shared_style_context" (e.g. "Charming colorful children's book illustration, vibrant friendly characters, soft warm lighting, high quality digital art").

Return strictly a JSON object matching this schema:
{{
  "title": "An exciting creative title for the story (e.g. The Secret Kitchen of Leo the Leaf)",
  "topic": "{topic}",
  "grade": "{grade_str}",
  "characters": ["Character 1 name", "Character 2 name"],
  "learning_objective": "1 clear sentence summarizing what students learn",
  "key_takeaway": "2-3 short bullet points summarizing the real science simply",
  "shared_style_context": "Charming colorful children's book illustration, vibrant friendly characters, soft lighting, digital art",
  "slides": [
    {{
      "slide_number": 1,
      "concept": "Chapter title (e.g. Chapter 1: The Leaf's Sunny Morning)",
      "subtitle": "2 to 4 sentences of vivid narrative where characters speak to each other with dialogue quotes (\"...\") explaining this step simply.",
      "image_prompt": "Purely visual scene description of this chapter for an AI image generator without text or words"
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
                    "content": "You are an expert educational storyteller and storyboard artist. Output ONLY a raw, complete JSON object matching the requested schema without any markdown code fences or conversational text."
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            temperature=0.5,
            max_completion_tokens=2500
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
            full_story_paragraphs = []
            for idx, slide in enumerate(parsed["slides"], 1):
                subtitle_text = str(slide.get("subtitle", f"Step {idx}: Learning about {topic}.")).strip()
                concept_text = str(slide.get("concept", f"Chapter {idx}: Exploring {topic}")).strip()
                img_prompt = str(slide.get("image_prompt") or slide.get("visual_prompt") or f"Charming storybook scene showing characters exploring {topic} at step {idx}").strip()
                
                validated_slides.append({
                    "slide_number": idx,
                    "concept": concept_text,
                    "subtitle": subtitle_text,
                    "image_prompt": img_prompt
                })
                full_story_paragraphs.append(subtitle_text)

            storyboard = {
                "title": parsed.get("title", f"The Adventure of {topic}"),
                "topic": topic,
                "grade": grade_str,
                "characters": parsed.get("characters", []),
                "learning_objective": parsed.get("learning_objective", f"Understand how {topic} works through a friendly story"),
                "key_takeaway": parsed.get("key_takeaway", f"Core concepts of {topic}"),
                "shared_style_context": parsed.get("shared_style_context", f"Charming colorful children's book illustration for {grade_str}"),
                "full_story": "\n\n---\n\n".join(full_story_paragraphs),
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
        fallback_slides = [
            {
                "slide_number": 1,
                "concept": f"Chapter 1: The Wonder of {topic}",
                "subtitle": f"\"Hello there!\" called the friendly characters gathering under the morning sky to explore the magic of {topic}. \"Are you ready to see how it works?\"",
                "image_prompt": f"Charming storybook illustration of friendly nature characters gathering under a bright blue morning sky to learn about {topic}."
            },
            {
                "slide_number": 2,
                "concept": f"Chapter 2: The Ingredients Come Together",
                "subtitle": f"\"Look at this!\" smiled the little helpers as each ingredient arrived right on time. Everything connected smoothly to start the amazing process of {topic}.",
                "image_prompt": f"Cute friendly characters working together in a colorful nature scene demonstrating {topic}."
            },
            {
                "slide_number": 3,
                "concept": f"Chapter 3: The Magical Transformation",
                "subtitle": f"\"It is working!\" they cheered as energy flowed and transformed into something wonderful. \"Nature has the most incredible recipe!\"",
                "image_prompt": f"Glowing colorful visual transformation scene illustrating {topic} in a children's storybook style."
            },
            {
                "slide_number": 4,
                "concept": f"Chapter 4: Helping the Whole World",
                "subtitle": f"\"Thank you!\" called the woodland animals and human friends, taking a happy breath and celebrating together. {topic} keeps our world healthy and alive!",
                "image_prompt": f"Happy woodland animals and human friends smiling together in a lush vibrant nature meadow."
            }
        ]
        if count == 5:
            fallback_slides.insert(2, {
                "slide_number": 3,
                "concept": f"Chapter 3: Inside the Workshop",
                "subtitle": f"\"Step inside and watch closely!\" whispered the guide. The microscopic workers were busy assembling every piece with perfect harmony.",
                "image_prompt": f"A close-up magical view of natural elements working harmoniously together to power {topic}."
            })
            for i, s in enumerate(fallback_slides, 1):
                s["slide_number"] = i

        return {
            "success": True,
            "storyboard": {
                "title": f"The Story of {topic}",
                "topic": topic,
                "grade": grade_str,
                "characters": ["Nature Friends", "Sun & Rain", "Woodland Animals"],
                "learning_objective": f"Learn key steps of {topic} through a fun story",
                "key_takeaway": f"Understanding how {topic} supports living things.",
                "shared_style_context": f"Charming colorful storybook illustration for {grade_str}",
                "full_story": "\n\n---\n\n".join([s["subtitle"] for s in fallback_slides]),
                "slides": fallback_slides
            },
            "warning": f"Generated using fallback structure due to AI format issue: {str(e)}"
        }


# Alias for backward compatibility
generate_image_story_ai = generate_storyboard




