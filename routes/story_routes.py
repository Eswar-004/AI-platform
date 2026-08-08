from flask import Blueprint, request, jsonify
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.ai_service import generate_story_ai

story_bp = Blueprint("story", __name__)

@story_bp.route("/generate", methods=["POST"])
@story_bp.route("", methods=["POST"])
@story_bp.route("/", methods=["POST"])
def generate_story_endpoint():
    """
    POST /api/story/generate or POST /api/story
    Accepts: { "topic": str, "prompt": str, "gradeLevel": str, "subject": str (optional) }
    """
    data = request.get_json() or {}
    topic = data.get("topic") or data.get("prompt") or ""
    topic = str(topic).strip()
    grade_level = str(data.get("gradeLevel", data.get("grade_level", "6"))).strip()
    subject = str(data.get("subject", "")).strip()

    if not topic:
        return jsonify({
            "message": "Topic is required to generate a story."
        }), 400

    try:
        result = generate_story_ai(topic=topic, grade_level=grade_level, subject=subject)

        # Check if output is clarification_needed
        if isinstance(result, dict) and result.get("error") == "clarification_needed":
            return jsonify({
                "message": result.get("message", "Topic is unclear. Please provide more context or a clearer topic.")
            }), 400

        return jsonify(result), 200

    except Exception as e:
        print(f"Error generating story: {e}", file=sys.stderr)
        return jsonify({
            "message": f"Failed to generate story: {str(e)}"
        }), 500
