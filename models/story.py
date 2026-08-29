from datetime import datetime
from extensions import db


class Story(db.Model):
    __tablename__ = "story"

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    topic = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    grade = db.Column(db.String(100), nullable=False)
    slide_count = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    slides = db.relationship("StorySlide", backref="story", cascade="all, delete-orphan", order_by="StorySlide.slide_number")

    def to_dict(self):
        return {
            "id": self.id,
            "teacher_id": self.teacher_id,
            "topic": self.topic,
            "title": self.title,
            "grade": self.grade,
            "slide_count": self.slide_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "slides": [slide.to_dict() for slide in self.slides]
        }


from sqlalchemy.dialects.mysql import LONGTEXT

class StorySlide(db.Model):
    __tablename__ = "story_slide"

    id = db.Column(db.Integer, primary_key=True)
    story_id = db.Column(db.Integer, db.ForeignKey("story.id"), nullable=False)
    slide_number = db.Column(db.Integer, nullable=False)
    subtitle = db.Column(db.Text, nullable=False)
    image_prompt = db.Column(db.Text, nullable=True)
    image_url = db.Column(LONGTEXT, nullable=True)
    image_status = db.Column(db.String(50), default="ready")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "story_id": self.story_id,
            "slide_number": self.slide_number,
            "subtitle": self.subtitle,
            "image_url": self.image_url,
            "image_status": self.image_status,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
