from flask import Blueprint, request, jsonify
from datetime import datetime
from extensions import db
from models import User, Assignment, Submission, TeacherStudent, StudentProgress
from utils.auth import role_required, get_current_user

teacher_bp = Blueprint("teacher", __name__)


@teacher_bp.route("/students", methods=["POST"])
@role_required("teacher")
def create_student():
    teacher = get_current_user()
    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", "")).strip()

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email, and password are required."
        }), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({
            "success": False,
            "message": "A user with this email already exists."
        }), 400

    student = User(name=name, email=email, role="student")
    student.set_password(password)
    db.session.add(student)
    db.session.flush()

    # Link teacher and student
    link = TeacherStudent(teacher_id=teacher.id, student_id=student.id)
    db.session.add(link)

    # Initial student progress entry
    progress = StudentProgress(student_id=student.id, subject="General AI Learning", progress_percentage=0.0)
    db.session.add(progress)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student account created successfully.",
        "student": student.to_dict()
    }), 201


@teacher_bp.route("/students", methods=["GET"])
@role_required("teacher")
def get_students():
    teacher = get_current_user()

    # Fetch students linked to teacher or all student role users
    linked_ids = [ts.student_id for ts in TeacherStudent.query.filter_by(teacher_id=teacher.id).all()]
    if linked_ids:
        students = User.query.filter(User.id.in_(linked_ids), User.role == "student").all()
    else:
        students = User.query.filter_by(role="student").all()

    students_list = []
    for s in students:
        s_data = s.to_dict()
        # Attach progress info if exists
        progress = StudentProgress.query.filter_by(student_id=s.id).first()
        s_data["progress"] = progress.to_dict() if progress else None
        # Count tasks
        total_tasks = Assignment.query.filter_by(student_id=s.id).count()
        completed_tasks = Assignment.query.filter_by(student_id=s.id, status="reviewed").count()
        s_data["total_tasks"] = total_tasks
        s_data["completed_tasks"] = completed_tasks
        students_list.append(s_data)

    return jsonify({
        "success": True,
        "students": students_list
    }), 200


@teacher_bp.route("/tasks", methods=["POST"])
@role_required("teacher")
def assign_task():
    teacher = get_current_user()
    data = request.get_json() or {}
    student_id = data.get("student_id")
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    subject = str(data.get("subject", "Science")).strip()
    due_date_str = data.get("due_date")

    if not student_id or not title:
        return jsonify({
            "success": False,
            "message": "Student ID and task title are required."
        }), 400

    student = User.query.filter_by(id=student_id, role="student").first()
    if not student:
        return jsonify({
            "success": False,
            "message": "Selected student does not exist."
        }), 404

    due_date = None
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        except ValueError:
            try:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            except ValueError:
                pass

    task = Assignment(
        teacher_id=teacher.id,
        student_id=student.id,
        title=title,
        description=description,
        subject=subject,
        due_date=due_date,
        status="assigned"
    )
    db.session.add(task)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Task assigned successfully.",
        "task": task.to_dict()
    }), 201


@teacher_bp.route("/tasks", methods=["GET"])
@role_required("teacher")
def get_teacher_tasks():
    teacher = get_current_user()
    tasks = Assignment.query.filter_by(teacher_id=teacher.id).order_by(Assignment.created_at.desc()).all()
    return jsonify({
        "success": True,
        "tasks": [t.to_dict() for t in tasks]
    }), 200


@teacher_bp.route("/reviews", methods=["GET"])
@role_required("teacher")
def get_reviews():
    teacher = get_current_user()
    teacher_task_ids = [t.id for t in Assignment.query.filter_by(teacher_id=teacher.id).all()]
    if teacher_task_ids:
        submissions = Submission.query.filter(Submission.assignment_id.in_(teacher_task_ids)).order_by(Submission.submitted_at.desc()).all()
    else:
        submissions = Submission.query.order_by(Submission.submitted_at.desc()).all()

    return jsonify({
        "success": True,
        "submissions": [sub.to_dict() for sub in submissions]
    }), 200


@teacher_bp.route("/reviews/<int:submission_id>", methods=["POST"])
@role_required("teacher")
def review_submission(submission_id):
    data = request.get_json() or {}
    feedback = str(data.get("feedback", "")).strip()
    marks = data.get("marks")

    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({
            "success": False,
            "message": "Submission not found."
        }), 404

    submission.teacher_feedback = feedback
    submission.status = "reviewed"
    if marks is not None:
        try:
            submission.marks = float(marks)
        except (ValueError, TypeError):
            pass

    # Update associated assignment status to 'reviewed'
    if submission.assignment:
        submission.assignment.status = "reviewed"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Student work reviewed successfully.",
        "submission": submission.to_dict()
    }), 200
