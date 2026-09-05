from flask import Flask, jsonify, send_from_directory
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
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

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


@app.route("/storymode/<path:filename>", methods=["GET"])
def serve_storymode_static(filename):
    """Serve images and assets from the storymode directory."""
    storymode_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storymode")
    return send_from_directory(storymode_dir, filename)


@app.route("/videos/<path:filename>", methods=["GET"])
def serve_videos_static(filename):
    """Serve video lessons from the videos directory."""
    videos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos")
    return send_from_directory(videos_dir, filename)


@app.route("/", methods=["GET"])
def serve_index():
    """Serve the main student & teacher application HTML."""
    root_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(root_dir, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def serve_root_files(filename):
    """Serve root static assets (CSS, JS, images, logo, etc.)."""
    root_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(root_dir, filename)
    if os.path.isfile(file_path):
        return send_from_directory(root_dir, filename)
    return jsonify({"error": f"File '{filename}' not found"}), 404


# Run initialization logic
init_db_and_seed()


if __name__ == "__main__":
    print(f"Starting AI backend on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
