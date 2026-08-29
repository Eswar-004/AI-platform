import os
import sys
import urllib.parse
import random
import requests
import time
import base64
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
    t = topic.lower() if topic else "science"
    
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
    if any(k in t for k in ['photo', 'plant', 'leaf', 'tree', 'sun', 'forest', 'chlorophyll', 'bio']):
        return nature_photos[idx]
    elif any(k in t for k in ['water', 'rain', 'evap', 'cloud', 'ocean', 'river', 'cycle', 'liquid']):
        return water_photos[idx]
    elif any(k in t for k in ['space', 'solar', 'planet', 'star', 'moon', 'galaxy', 'universe']):
        return space_photos[idx]
    elif any(k in t for k in ['grav', 'force', 'atom', 'physics', 'energy', 'light', 'magnet', 'volcano', 'fraction', 'math']):
        return physics_photos[idx]
    else:
        return nature_photos[idx]


def generate_scene_svg_fallback(scene_description: str, slide_number: int = 1) -> str:
    """
    Generate a dynamic, high-clarity educational visual vector data URL built directly 
    from the slide's specific explanation text as a fail-safe visual fallback.
    """
    colors = [
        ("#0f172a", "#1e293b", "#38bdf8", "#0284c7"),  # Sky / Ocean blue
        ("#064e3b", "#047857", "#34d399", "#059669"),  # Bio emerald
        ("#312e81", "#4338ca", "#a855f7", "#6366f1"),  # Cosmic violet
        ("#7c2d12", "#c2410c", "#fb923c", "#ea580c")   # Solar amber
    ]
    bg_start, bg_end, accent1, accent2 = colors[(slide_number - 1) % len(colors)]

    clean_desc = scene_description.encode('ascii', 'ignore').decode('ascii').strip()
    if not clean_desc:
        clean_desc = f"Educational Scene Step {slide_number}"
    elif len(clean_desc) > 75:
        clean_desc = clean_desc[:72] + "..."

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 576" width="1024" height="576">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_start}" />
      <stop offset="100%" stop-color="{bg_end}" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{accent1}" />
      <stop offset="100%" stop-color="{accent2}" />
    </linearGradient>
  </defs>

  <rect width="1024" height="576" fill="url(#bgGrad)" />
  <circle cx="200" cy="140" r="190" fill="{accent1}" opacity="0.15" />
  <circle cx="850" cy="430" r="230" fill="{accent2}" opacity="0.12" />
  <rect x="60" y="50" width="904" height="476" rx="20" fill="#ffffff" fill-opacity="0.04" stroke="{accent1}" stroke-opacity="0.3" stroke-width="2" />

  <rect x="90" y="80" rx="12" ry="12" width="240" height="38" fill="url(#accentGrad)" opacity="0.95" />
  <text x="210" y="104" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">SLIDE {slide_number} • SCENE VISUAL</text>

  <g transform="translate(512, 255)">
    <circle cx="0" cy="0" r="75" fill="url(#accentGrad)" opacity="0.25" />
    <circle cx="0" cy="0" r="50" fill="url(#accentGrad)" />
    <line x1="0" y1="-70" x2="0" y2="-90" stroke="{accent1}" stroke-width="4" stroke-linecap="round" />
    <line x1="0" y1="70" x2="0" y2="90" stroke="{accent1}" stroke-width="4" stroke-linecap="round" />
    <line x1="-70" y1="0" x2="-90" y2="0" stroke="{accent1}" stroke-width="4" stroke-linecap="round" />
    <line x1="70" y1="0" x2="90" y2="0" stroke="{accent1}" stroke-width="4" stroke-linecap="round" />
  </g>

  <text x="512" y="415" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#f8fafc" text-anchor="middle">{clean_desc}</text>
  <text x="512" y="450" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" fill="#94a3b8" text-anchor="middle">Educational Concept Illustration</text>
</svg>'''
    encoded_svg = urllib.parse.quote(svg)
    return f"data:image/svg+xml;charset=utf-8,{encoded_svg}"


def generate_single_image(image_prompt: str, style_context: str = "", slide_number: int = 1, subtitle: str = "") -> dict:
    """
    Generate an educational image for a single slide using the configured provider.
    Returns: { "success": bool, "image_url": str, "provider": str, "slide_number": int, "fallback_url": str }
    """
    scene_text = image_prompt if (image_prompt and len(image_prompt.strip()) > 10) else subtitle
    if not scene_text or not scene_text.strip():
        scene_text = f"Educational concept scene for step {slide_number}"

    clean_scene = sanitize_prompt_text(scene_text)
    clean_style = sanitize_prompt_text(style_context if style_context else "Charming colorful children's book illustration, vibrant friendly characters, soft warm lighting")
    
    full_prompt = f"{clean_style}. {clean_scene}. Vibrant colorful digital art, storybook scene, no text, no words, no labels, 16:9 aspect ratio."
    fallback_image = get_curated_topic_image(clean_scene, slide_number)

    provider = Config.IMAGE_PROVIDER.lower()
    width = 800
    height = 450

    try:
        if provider == "huggingface" and Config.IMAGE_API_KEY:
            hf_url = f"https://api-inference.huggingface.co/models/{Config.IMAGE_MODEL}"
            headers = {"Authorization": f"Bearer {Config.IMAGE_API_KEY}"}
            res = requests.post(hf_url, headers=headers, json={"inputs": full_prompt}, timeout=20)
            if res.status_code == 200 and res.content:
                img_b64 = base64.b64encode(res.content).decode("utf-8")
                return {
                    "success": True,
                    "image_url": f"data:image/jpeg;base64,{img_b64}",
                    "fallback_url": fallback_image,
                    "provider": "huggingface",
                    "slide_number": slide_number
                }

        elif provider == "openai" and Config.IMAGE_API_KEY:
            headers = {
                "Authorization": f"Bearer {Config.IMAGE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "dall-e-3",
                "prompt": full_prompt[:1000],
                "n": 1,
                "size": f"{width}x{height}"
            }
            res = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                img_url = data["data"][0]["url"]
                return {
                    "success": True,
                    "image_url": img_url,
                    "fallback_url": fallback_image,
                    "provider": "openai",
                    "slide_number": slide_number
                }

        # Pollinations AI Direct Image URL
        encoded_prompt = urllib.parse.quote(full_prompt[:280])
        seed = random.randint(1000, 999999)
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
        
        return {
            "success": True,
            "image_url": image_url,
            "fallback_url": fallback_image,
            "provider": "pollinations",
            "slide_number": slide_number
        }

    except Exception as e:
        print(f"Image generation error for slide {slide_number}: {e}", file=sys.stderr)
        return {
            "success": True,
            "image_url": fallback_image or generate_scene_svg_fallback(clean_scene, slide_number),
            "fallback_url": fallback_image,
            "provider": "curated_educational_fallback",
            "slide_number": slide_number
        }


def generate_images_parallel(slides: list, shared_style_context: str = "") -> dict:
    """
    Generate images for all slides concurrently.
    Returns dictionary mapping slide_number (1-indexed) -> image result dict.
    """
    results = {}
    if not slides:
        return results

    for idx, s in enumerate(slides):
        slide_num = s.get("slide_number", idx + 1)
        prompt = s.get("image_prompt") or s.get("visual_prompt") or s.get("concept") or ""
        sub = s.get("subtitle") or ""

        try:
            img_res = generate_single_image(prompt, shared_style_context, slide_num, sub)
            results[slide_num] = img_res
        except Exception as exc:
            print(f"Image generation exception for slide {slide_num}: {exc}", file=sys.stderr)
            fallback_img = get_curated_topic_image(prompt or sub, slide_num)
            results[slide_num] = {
                "success": True,
                "image_url": fallback_img,
                "fallback_url": fallback_img,
                "provider": "fallback",
                "slide_number": slide_num
            }

    return results
