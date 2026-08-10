from flask import Flask
from flask_cors import CORS
import sys
import os

# Adjust path to import files correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import Config
from routes.ai_routes import ai_bp
from routes.story_routes import story_bp

app = Flask(__name__)

# Enable CORS for cross-origin frontend requests from local dev server
CORS(app)

# Register blueprints
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(story_bp, url_prefix="/api/story")

@app.route("/health", methods=["GET"])
def health_check():
    return {"status": "ok", "message": "AI backend is running"}, 200

if __name__ == "__main__":
    print(f"Starting AI backend on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
