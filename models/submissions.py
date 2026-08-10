from extensions import db
from datetime import datetime


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("assignments.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    answer = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    teacher_feedback = db.Column(db.Text, nullable=True)
    marks = db.Column(db.Numeric(5, 2), nullable=True)
    status = db.Column(db.String(50), default="submitted")

    # Relationships
    assignment = db.relationship("Assignment", backref="submissions")
    student = db.relationship("User", backref="submissions")

    def to_dict(self):
        return {
            "id": self.id,
            "assignment_id": self.assignment_id,
            "task_title": self.assignment.title if self.assignment else None,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "student_email": self.student.email if self.student else None,
            "answer": self.answer,
            "submitted_at": self.submitted_at.strftime("%Y-%m-%d %H:%M") if self.submitted_at else None,
            "teacher_feedback": self.teacher_feedback,
            "marks": float(self.marks) if self.marks is not None else None,
            "status": self.status
        }
