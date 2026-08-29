import os
import sys
import urllib.parse
import random
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config


def sanitize_prompt_text(text: str) -> str:
    """Normalize unicode characters (like subscripts CO2, smart quotes) for clean URL encoding."""
    if not text:
        return ""
    # Map common subscripts and special unicode
    replacements = {
        '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
        '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9',
        '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u2014': '-', '\u2013': '-'
    }
    cleaned = text
    for k, v in replacements.items():
        cleaned = cleaned.replace(k, v)
    return cleaned.strip()


def get_curated_topic_image(topic: str, slide_number: int = 1) -> str:
    """Provide high quality educational fallback image based on topic keyword."""
    t = topic.lower()
    
    # Topic specific curated educational collections
    nature_photos = [
        "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=900&auto=format&fit=crop&q=80", # sunny green leaf
        "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80", # sunlight forest
        "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=900&auto=format&fit=crop&q=80", # morning trees
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=900&auto=format&fit=crop&q=80", # green forest canopy
        "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=900&auto=format&fit=crop&q=80", # animals nature meadow
    ]
    water_photos = [
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=900&auto=format&fit=crop&q=80", # water splash
        "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=900&auto=format&fit=crop&q=80", # clouds sky
        "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=900&auto=format&fit=crop&q=80", # rain drops
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80", # ocean water cycle
        "https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=900&auto=format&fit=crop&q=80", # river nature
    ]
    space_photos = [
        "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=900&auto=format&fit=crop&q=80", # solar system planets
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80", # earth from space
        "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=900&auto=format&fit=crop&q=80", # starry night
        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&auto=format&fit=crop&q=80", # galaxy nebula
        "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=900&auto=format&fit=crop&q=80", # telescope astronomy
    ]
    physics_photos = [
        "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=900&auto=format&fit=crop&q=80", # light rays gravity
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&auto=format&fit=crop&q=80", # science lab
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&auto=format&fit=crop&q=80", # magnetic energy
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80", # technology physics
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=900&auto=format&fit=crop&q=80", # scientific formula
    ]

    idx = (slide_number - 1) % 5
    if any(k in t for k in ['photo', 'plant', 'leaf', 'tree', 'sun', 'forest', 'chlorophyll']):
        return nature_photos[idx]
    elif any(k in t for k in ['water', 'rain', 'evap', 'cloud', 'ocean', 'river', 'cycle']):
        return water_photos[idx]
    elif any(k in t for k in ['space', 'solar', 'planet', 'star', 'sun', 'moon', 'galaxy']):
        return space_photos[idx]
    elif any(k in t for k in ['grav', 'force', 'atom', 'physics', 'energy', 'light', 'magnet', 'volcano', 'fraction', 'math']):
        return physics_photos[idx]
    else:
        return nature_photos[idx]


def generate_single_image(image_prompt: str, style_context: str = "", slide_number: int = 1) -> dict:
    """
    Generate an educational image for a single slide using the configured provider.
    Returns: { "success": bool, "image_url": str, "provider": str, "slide_number": int, "fallback_url": str }
    """
    if not image_prompt or not image_prompt.strip():
        return {
            "success": False,
            "error": "Image prompt is empty.",
            "slide_number": slide_number,
            "image_url": None,
            "fallback_url": get_curated_topic_image("science", slide_number)
        }

    provider = Config.IMAGE_PROVIDER.lower()
    width = 800
    height = 450

    clean_style = sanitize_prompt_text(style_context.strip() if style_context else "Charming colorful children's book illustration, vibrant friendly characters, soft warm lighting")
    clean_prompt = sanitize_prompt_text(image_prompt.strip())
    
    full_prompt = f"{clean_style}. {clean_prompt}. Vibrant colorful digital art, storybook scene, no text, no words, no labels, 16:9 aspect ratio."
    fallback_image = get_curated_topic_image(clean_prompt, slide_number)

    try:
        if provider == "pollinations":
            encoded_prompt = urllib.parse.quote(full_prompt)
            seed = random.randint(1000, 999999)
            # Use fast pollinations parameters without flux to avoid 429 rate limit timeouts
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
            
            return {
                "success": True,
                "image_url": image_url,
                "fallback_url": fallback_image,
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
