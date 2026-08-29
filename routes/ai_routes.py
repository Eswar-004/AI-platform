from flask import Blueprint, request, jsonify
import sys
import os

# Adjust path to import services if run from different Cwds
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.ai_service import generate_response, generate_story_ai, generate_quiz_ai

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/chat", methods=["POST"])
def ai_chat():
    """
    POST /api/ai/chat
    Expects request JSON payload:
    {
        "prompt": "Explain Photosynthesis"
    }
    Response JSON payload:
    {
        "success": true,
        "response": "..."
    }
    """
    data = request.get_json() or {}
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({
            "success": False,
            "response": "Prompt cannot be empty."
        }), 400

    try:
        response_text = generate_response(prompt)
        return jsonify({
            "success": True,
            "response": response_text
        }), 200
    except Exception as e:
        print(f"Error handling AI response: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "response": f"AI service error: {str(e)}"
        }), 500


@ai_bp.route("/quiz", methods=["POST"])
def ai_quiz():
    """
    POST /api/ai/quiz
    Expects request JSON payload:
    {
        "subject": "Science",
        "topic": "Water Cycles",
        "difficulty": "Medium",
        "question_type": "MCQ",
        "num_questions": 3
    }
    Response JSON payload:
    {
        "success": true,
        "questions": [...]
    }
    """
    data = request.get_json() or {}
    subject = str(data.get("subject", "Science")).strip()
    topic = str(data.get("topic", "Water Cycles")).strip()
    difficulty = str(data.get("difficulty", "Medium")).strip()
    question_type = str(data.get("question_type", data.get("questionType", "MCQ"))).strip()
    try:
        num_questions = int(data.get("num_questions", data.get("numQuestions", 3)))
    except (ValueError, TypeError):
        num_questions = 3

    try:
        quiz_data = generate_quiz_ai(
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            question_type=question_type,
            num_questions=num_questions
        )
        return jsonify(quiz_data), 200
    except Exception as e:
        print(f"Error in /api/ai/quiz: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "message": f"Quiz generation error: {str(e)}"
        }), 500


@ai_bp.route("/story", methods=["POST"])
def ai_story():
    """
    POST /api/ai/story
    Accepts: { "prompt": str } or { "topic": str, "gradeLevel": str }
    """
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    topic = data.get("topic", prompt) or ""
    topic = str(topic).strip()
    grade_level = str(data.get("gradeLevel", data.get("grade_level", "6"))).strip()
    subject = str(data.get("subject", "")).strip()

    if not topic and not prompt:
        return jsonify({
            "success": False,
            "response": "Topic or prompt is required."
        }), 400

    try:
        result = generate_story_ai(topic=topic or prompt, grade_level=grade_level, subject=subject)
        if isinstance(result, dict) and result.get("error") == "clarification_needed":
            return jsonify({
                "success": False,
                "response": result.get("message", "Topic is unclear.")
            }), 400

        story_text = result.get("story", result.get("response", ""))
        return jsonify({
            "success": True,
            "response": story_text,
            "story": story_text,
            "title": result.get("title", f"The Story of {topic}")
        }), 200
    except Exception as e:
        print(f"Error in /api/ai/story: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "response": f"Story generation error: {str(e)}"
        }), 500


