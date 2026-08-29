import os
import sys
import urllib.parse
import random
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def generate_single_image(image_prompt: str, style_context: str = "", slide_number: int = 1) -> dict:
    """
    Generate an educational image for a single slide using the configured provider.
    Returns: { "success": bool, "image_url": str, "provider": str, "slide_number": int, "error": str }
    """
    if not image_prompt or not image_prompt.strip():
        return {
            "success": False,
            "error": "Image prompt is empty.",
            "slide_number": slide_number,
            "image_url": None
        }

    provider = Config.IMAGE_PROVIDER.lower()
    width = Config.IMAGE_WIDTH
    height = Config.IMAGE_HEIGHT
    model = Config.IMAGE_MODEL

    # Construct clean prompt emphasizing NO text, NO labels, high educational visual quality
    clean_style = style_context.strip() if style_context else "Clean modern educational textbook illustration, scientifically accurate, high visual clarity"
    clean_prompt = image_prompt.strip()
    
    full_prompt = f"{clean_style}. {clean_prompt}. Scientifically accurate illustration, vivid clear visuals, no text, no words, no labels, no watermark, 16:9 aspect ratio."

    try:
        if provider == "pollinations":
            # Generate instant high-resolution AI image via Pollinations AI
            encoded_prompt = urllib.parse.quote(full_prompt)
            seed = random.randint(1000, 999999)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&model={model}&nologo=true"
            
            return {
                "success": True,
                "image_url": image_url,
                "provider": "pollinations",
                "slide_number": slide_number
            }

        elif provider == "huggingface":
            if not Config.IMAGE_API_KEY:
                return {
                    "success": False,
                    "error": "IMAGE_API_KEY is missing in backend/.env for Hugging Face provider.",
                    "slide_number": slide_number,
                    "image_url": None
                }
            
            hf_url = f"https://api-inference.huggingface.co/models/{model}"
            headers = {"Authorization": f"Bearer {Config.IMAGE_API_KEY}"}
            res = requests.post(hf_url, headers=headers, json={"inputs": full_prompt}, timeout=30)
            
            if res.status_code == 200:
                # Return data URL or save locally
                import base64
                img_b64 = base64.b64encode(res.content).decode("utf-8")
                return {
                    "success": True,
                    "image_url": f"data:image/jpeg;base64,{img_b64}",
                    "provider": "huggingface",
                    "slide_number": slide_number
                }
            else:
                return {
                    "success": False,
                    "error": f"HuggingFace API error HTTP {res.status_code}: {res.text}",
                    "slide_number": slide_number,
                    "image_url": None
                }

        elif provider == "openai":
            if not Config.IMAGE_API_KEY:
                return {
                    "success": False,
                    "error": "IMAGE_API_KEY is missing in backend/.env for OpenAI provider.",
                    "slide_number": slide_number,
                    "image_url": None
                }

            headers = {
                "Authorization": f"Bearer {Config.IMAGE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "dall-e-3",
                "prompt": full_prompt,
                "n": 1,
                "size": f"{width}x{height}"
            }
            res = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.get_json()
                img_url = data["data"][0]["url"]
                return {
                    "success": True,
                    "image_url": img_url,
                    "provider": "openai",
                    "slide_number": slide_number
                }
            else:
                return {
                    "success": False,
                    "error": f"OpenAI DALL-E error HTTP {res.status_code}: {res.text}",
                    "slide_number": slide_number,
                    "image_url": None
                }

        else:
            # Fallback to Pollinations if provider unknown
            encoded_prompt = urllib.parse.quote(full_prompt)
            seed = random.randint(1000, 999999)
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
            return {
                "success": True,
                "image_url": image_url,
                "provider": "pollinations_fallback",
                "slide_number": slide_number
            }

    except Exception as e:
        print(f"Image generation error for slide {slide_number}: {e}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "slide_number": slide_number,
            "image_url": None
        }


def generate_images_parallel(slides: list, shared_style_context: str = "") -> dict:
    """
    Generate images for all slides concurrently using ThreadPoolExecutor.
    Returns dictionary mapping slide_number (1-indexed) -> image result dict.
    """
    results = {}
    if not slides:
        return results

    max_workers = min(len(slides), 5)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_slide = {}
        for s in slides:
            slide_num = s.get("slide_number", 1)
            prompt = s.get("image_prompt") or s.get("visual_prompt") or ""
            future = executor.submit(generate_single_image, prompt, shared_style_context, slide_num)
            future_to_slide[future] = slide_num

        for future in as_completed(future_to_slide):
            slide_num = future_to_slide[future]
            try:
                img_res = future.result()
                results[slide_num] = img_res
            except Exception as exc:
                print(f"Parallel image task exception for slide {slide_num}: {exc}", file=sys.stderr)
                results[slide_num] = {
                    "success": False,
                    "error": str(exc),
                    "slide_number": slide_num,
                    "image_url": None
                }

    return results
