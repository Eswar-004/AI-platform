from extensions import db
from datetime import datetime


class StudentProgress(db.Model):
    __tablename__ = "student_progress"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    progress_percentage = db.Column(db.Numeric(5, 2), default=0.00)
    lessons_completed = db.Column(db.Integer, default=0)
    total_lessons = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "subject": self.subject,
            "progress_percentage": float(self.progress_percentage) if self.progress_percentage is not None else 0.0,
            "lessons_completed": self.lessons_completed,
            "total_lessons": self.total_lessons,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
