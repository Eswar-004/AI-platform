from flask import Blueprint, request, jsonify
import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extensions import db
from models import Story, StorySlide
from services.ai_service import generate_storyboard
from services.image_service import generate_images_parallel, generate_single_image
from utils.auth import get_current_user

story_bp = Blueprint("story", __name__)


@story_bp.route("", methods=["GET"])
@story_bp.route("/", methods=["GET"])
def get_storyboard_endpoint():
    """
    GET /api/story/
    Returns the contents of storymode/storyboard.json without modifying story content.
    """
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storymode", "storyboard.json")
    if not os.path.exists(json_path):
        return jsonify({"success": False, "message": "storyboard.json not found in storymode/ directory."}), 404
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to read storyboard.json: {str(e)}"}), 500


@story_bp.route("/generate", methods=["POST"])
@story_bp.route("", methods=["POST"])
@story_bp.route("/", methods=["POST"])
def generate_story_endpoint():
    """
    POST /api/story/generate
    1. Single LLM request creates educational storyboard.
    2. Parallel image service generates actual image URLs concurrently.
    3. Persists Story and StorySlide in MySQL DB.
    """
    teacher = get_current_user()  # Optional/JWT teacher context if logged in
    teacher_id = teacher.id if teacher else None

    data = request.get_json() or {}
    topic = str(data.get("topic") or data.get("prompt") or "").strip()
    grade = str(data.get("grade") or data.get("gradeLevel") or data.get("grade_level") or "6th Standard").strip()
    try:
        slide_count = int(data.get("slide_count") or data.get("slideCount") or data.get("num_slides") or 5)
        if slide_count not in (4, 5):
            slide_count = 5
    except (ValueError, TypeError):
        slide_count = 5

    if not topic:
        return jsonify({
            "success": False,
            "message": "Topic is required to generate an educational story."
        }), 400

    try:
        # Step 1: Single LLM call to generate complete storyboard
        sb_result = generate_storyboard(topic=topic, grade=grade, slide_count=slide_count)
        if not sb_result.get("success") or "storyboard" not in sb_result:
            return jsonify({
                "success": False,
                "message": sb_result.get("message", "Failed to generate educational storyboard.")
            }), 500

        storyboard = sb_result["storyboard"]
        slides_data = storyboard.get("slides", [])
        shared_style = storyboard.get("shared_style_context", "")

        # Step 2: Parallel image generation for all slides
        img_results = generate_images_parallel(slides_data, shared_style_context=shared_style)

        # Step 3: Persist to Database
        new_story = Story(
            teacher_id=teacher_id,
            topic=topic,
            title=storyboard.get("title", f"Understanding {topic}"),
            grade=grade,
            slide_count=len(slides_data)
        )
        db.session.add(new_story)
        db.session.flush()

        saved_slides = []
        for s in slides_data:
            s_num = s.get("slide_number", 1)
            img_res = img_results.get(s_num, {})
            img_url = img_res.get("image_url")
            img_status = "ready" if (img_res.get("success") and img_url) else "failed"

            slide_model = StorySlide(
                story_id=new_story.id,
                slide_number=s_num,
                subtitle=s.get("subtitle", ""),
                image_prompt=s.get("image_prompt", ""),
                image_url=img_url if img_status == "ready" else None,
                image_status=img_status
            )
            db.session.add(slide_model)
            saved_slides.append(slide_model)

        db.session.commit()

        # Step 4: Construct clean JSON response
        story_dict = new_story.to_dict()
        for idx, slide_item in enumerate(story_dict.get("slides", [])):
            s_num = slide_item.get("slide_number", idx + 1)
            img_res = img_results.get(s_num, {})
            slide_item["fallback_url"] = img_res.get("fallback_url") or f"https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=900&auto=format&fit=crop&q=80"
        story_dict["characters"] = storyboard.get("characters", [])
        story_dict["learning_objective"] = storyboard.get("learning_objective", "")
        story_dict["key_takeaway"] = storyboard.get("key_takeaway", "")
        story_dict["full_story"] = storyboard.get("full_story", "\n\n---\n\n".join([s.get("subtitle", "") for s in slides_data]))

        return jsonify({
            "success": True,
            "story": story_dict,
            "title": story_dict.get("title", f"The Story of {topic}"),
            "response": story_dict["full_story"]
        }), 200

    except Exception as e:
        print(f"Error in generate_story_endpoint: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "message": f"Failed to generate story: {str(e)}"
        }), 500


@story_bp.route("/retry-image", methods=["POST"])
def retry_image_endpoint():
    """
    POST /api/story/retry-image
    Regenerates only the single slide image for a specific story slide if it failed or needs retry.
    Payload: { "story_id": int, "slide_number": int }
    """
    data = request.get_json() or {}
    story_id = data.get("story_id")
    slide_number = data.get("slide_number")

    if not story_id or not slide_number:
        return jsonify({
            "success": False,
            "message": "story_id and slide_number are required."
        }), 400

    try:
        slide = StorySlide.query.filter_by(story_id=story_id, slide_number=slide_number).first()
        if not slide:
            return jsonify({
                "success": False,
                "message": "Slide not found."
            }), 404

        story = Story.query.get(story_id)
        style_context = f"Clean modern educational illustration for {story.grade if story else '6th Standard'} students"

        img_res = generate_single_image(slide.image_prompt or slide.subtitle, style_context, slide.slide_number)
        if img_res.get("success") and img_res.get("image_url"):
            slide.image_url = img_res["image_url"]
            slide.image_status = "ready"
            db.session.commit()

            return jsonify({
                "success": True,
                "slide": slide.to_dict()
            }), 200
        else:
            slide.image_status = "failed"
            db.session.commit()
            return jsonify({
                "success": False,
                "message": img_res.get("error", "Image generation failed.")
            }), 500

    except Exception as e:
        print(f"Error in retry_image_endpoint: {e}", file=sys.stderr)
        return jsonify({
            "success": False,
            "message": f"Failed to retry image: {str(e)}"
        }), 500


