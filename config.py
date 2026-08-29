import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)


class Config:

    # MySQL Configuration
    MYSQL_HOST = "localhost"
    MYSQL_USER = "root"
    MYSQL_PASSWORD = "2004"
    MYSQL_DATABASE = "edumate_db"
    MYSQL_PORT = 3306

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}"
        f"@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Groq Configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_API_KEY")
    GROQ_API_URL = os.getenv(
        "GROQ_API_URL",
        "https://api.groq.com/openai/v1/chat/completions"
    )
    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "openai/gpt-oss-20b"
    )

    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() in (
        "true", "1", "yes"
    )

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "edumate-jwt-secret-key-2026-safe-key")

    # Image Generation Service Configuration
    IMAGE_PROVIDER = os.getenv("IMAGE_PROVIDER", "pollinations").lower()
    IMAGE_API_KEY = os.getenv("IMAGE_API_KEY", "")
    IMAGE_MODEL = os.getenv("IMAGE_MODEL", "flux")
    IMAGE_WIDTH = int(os.getenv("IMAGE_WIDTH", 1024))
    IMAGE_HEIGHT = int(os.getenv("IMAGE_HEIGHT", 576))

