from flask import Flask, jsonify
from flask_cors import CORS
import sys
import os

# Adjust path to import files correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import Config
from extensions import db, jwt
from models import User, Assignment, Submission, TeacherStudent, StudentProgress

from routes.ai_routes import ai_bp
from routes.story_routes import story_bp
from routes.auth_routes import auth_bp
from routes.teacher_routes import teacher_bp
from routes.student_routes import student_bp

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
jwt.init_app(app)

# Enable CORS for cross-origin frontend requests from local dev server
CORS(app)

# Register blueprints
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(story_bp, url_prefix="/api/story")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
app.register_blueprint(student_bp, url_prefix="/api/student")


def init_db_and_seed():
    """Ensure database tables exist and seed demo accounts if missing."""
    with app.app_context():
        db.create_all()

        # Seed Student demo account
        student_demo = User.query.filter_by(email="student@demo.com").first()
        if not student_demo:
            student_demo = User(
                name="Demo Student",
                email="student@demo.com",
                role="student"
            )
            student_demo.set_password("student123")
            db.session.add(student_demo)
            print("Created demo student account (student@demo.com / student123)")

        # Seed Teacher demo account
        teacher_demo = User.query.filter_by(email="teacher@demo.com").first()
        if not teacher_demo:
            teacher_demo = User(
                name="Demo Teacher",
                email="teacher@demo.com",
                role="teacher"
            )
            teacher_demo.set_password("teacher123")
            db.session.add(teacher_demo)
            print("Created demo teacher account (teacher@demo.com / teacher123)")

        db.session.commit()

        # Link student and teacher if not already linked
        if student_demo and teacher_demo:
            link = TeacherStudent.query.filter_by(
                teacher_id=teacher_demo.id,
                student_id=student_demo.id
            ).first()
            if not link:
                db.session.add(TeacherStudent(
                    teacher_id=teacher_demo.id,
                    student_id=student_demo.id
                ))
                db.session.commit()

            # Add demo progress for student if missing
            progress = StudentProgress.query.filter_by(student_id=student_demo.id).first()
            if not progress:
                db.session.add(StudentProgress(
                    student_id=student_demo.id,
                    subject="Mathematics & Science",
                    progress_percentage=75.0,
                    lessons_completed=12,
                    total_lessons=16
                ))
                db.session.commit()

            # Add a demo assigned task if none exist
            existing_task = Assignment.query.filter_by(student_id=student_demo.id).first()
            if not existing_task:
                demo_task = Assignment(
                    teacher_id=teacher_demo.id,
                    student_id=student_demo.id,
                    title="Solve Algebra Chapter 4 Practice",
                    description="Complete equations 1 through 10 on page 42. Explain your steps clearly.",
                    subject="Mathematics",
                    status="assigned"
                )
                db.session.add(demo_task)
                db.session.commit()


@app.route("/db-test")
def db_test():
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"success": True, "message": "MySQL connection successful!"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"MySQL connection failed: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "AI backend is running"}), 200


# Run initialization logic
init_db_and_seed()


if __name__ == "__main__":
    print(f"Starting AI backend on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
