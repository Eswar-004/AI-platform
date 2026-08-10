from flask import Blueprint, request, jsonify
from extensions import db
from models import Assignment, Submission
from utils.auth import role_required, get_current_user

student_bp = Blueprint("student", __name__)


@student_bp.route("/tasks", methods=["GET"])
@role_required("student")
def get_my_tasks():
    student = get_current_user()
    tasks = Assignment.query.filter_by(student_id=student.id).order_by(Assignment.created_at.desc()).all()

    tasks_data = []
    for t in tasks:
        td = t.to_dict()
        # Find submission if any
        sub = Submission.query.filter_by(assignment_id=t.id, student_id=student.id).first()
        td["submission"] = sub.to_dict() if sub else None
        tasks_data.append(td)

    return jsonify({
        "success": True,
        "tasks": tasks_data
    }), 200


@student_bp.route("/tasks/<int:task_id>/submit", methods=["POST"])
@role_required("student")
def submit_task(task_id):
    student = get_current_user()
    data = request.get_json() or {}
    answer = str(data.get("answer", "")).strip()

    if not answer:
        return jsonify({
            "success": False,
            "message": "Submission text/answer cannot be empty."
        }), 400

    task = Assignment.query.filter_by(id=task_id, student_id=student.id).first()
    if not task:
        return jsonify({
            "success": False,
            "message": "Task not found or access denied."
        }), 404

    # Check if existing submission
    submission = Submission.query.filter_by(assignment_id=task.id, student_id=student.id).first()
    if not submission:
        submission = Submission(assignment_id=task.id, student_id=student.id)
        db.session.add(submission)

    submission.answer = answer
    submission.status = "submitted"

    # Update task status
    task.status = "submitted"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Task submitted successfully.",
        "submission": submission.to_dict()
    }), 200


@student_bp.route("/submissions", methods=["GET"])
@role_required("student")
def get_my_submissions():
    student = get_current_user()
    submissions = Submission.query.filter_by(student_id=student.id).order_by(Submission.submitted_at.desc()).all()
    return jsonify({
        "success": True,
        "submissions": [sub.to_dict() for sub in submissions]
    }), 200
