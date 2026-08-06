from flask import Blueprint, request, jsonify
import sys
import os

# Adjust path to import services if run from different Cwds
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.ai_service import generate_response

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
        # Return exact error response structure requested by user
        return jsonify({
            "success": False,
            "response": "Unable to generate AI response."
        }), 500
