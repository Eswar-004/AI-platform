import sys
import os
from groq import Groq

# Adjust path to import config if run from different Cwds
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

def generate_response(prompt: str) -> str:
    """
    Calls the Groq Chat Completions API using the official Groq SDK.
    Returns the generated text response.
    """
    if not Config.GROQ_API_KEY or Config.GROQ_API_KEY == "YOUR_API_KEY":
        raise ValueError("GROQ_API_KEY is not configured. Please add your key to backend/.env")

    # Instantiate official Groq client
    client = Groq(api_key=Config.GROQ_API_KEY)

    try:
        # Call chat completions using official Groq SDK
        completion = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are EduMate AI, an educational assistant that explains concepts clearly for students."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_completion_tokens=2048,
            top_p=1,
            stream=False
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq SDK: {e}", file=sys.stderr)
        raise e
