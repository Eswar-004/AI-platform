from extensions import db
from datetime import datetime


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject = db.Column(db.String(100), nullable=True)
    due_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default="assigned")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships for convenience
    teacher = db.relationship("User", foreign_keys=[teacher_id], backref="created_assignments")
    student = db.relationship("User", foreign_keys=[student_id], backref="assigned_tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.name if self.teacher else None,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "title": self.title,
            "description": self.description,
            "subject": self.subject,
            "due_date": self.due_date.strftime("%Y-%m-%d %H:%M") if self.due_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
