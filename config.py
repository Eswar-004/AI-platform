import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)


class Config:

    # MySQL Configuration
    MYSQL_HOST = "localhost"
    MYSQL_USER = "root"
<<<<<<< HEAD
    MYSQL_PASSWORD = "2004"
=======
    MYSQL_PASSWORD = "root"
>>>>>>> f8e5567d7cf1e9aa6737d40e60bfc3240f9718e3
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
        "llama-3.3-70b-versatile"
    )

    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() in (
        "true", "1", "yes"
    )

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "edumate-jwt-secret-key-2026-safe-key")
