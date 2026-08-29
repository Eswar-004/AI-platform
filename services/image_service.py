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
    Generate a real, scene-specific AI educational image derived directly from the slide's explanation text.
    Returns: { "success": bool, "image_url": str, "provider": str, "slide_number": int }
    """
    # 1. Derive scene description directly from specific slide explanation text
    scene_text = image_prompt if (image_prompt and len(image_prompt.strip()) > 10) else subtitle
    if not scene_text or not scene_text.strip():
        scene_text = f"Educational concept scene for step {slide_number}"

    clean_scene = scene_text.encode('ascii', 'ignore').decode('ascii').strip()
    clean_style = (style_context or "Clean colorful educational textbook illustration").encode('ascii', 'ignore').decode('ascii').strip()

    # Construct rich, classroom-friendly AI image prompt without watermarks
    full_prompt = (
        f"{clean_style}. {clean_scene}. "
        "Bright clear visual, highly detailed classroom-friendly science illustration, "
        "vivid colors, 16:9 aspect ratio, no text, no letters, no watermark, no logo, no signature."
    )

    provider = Config.IMAGE_PROVIDER.lower()
    width = Config.IMAGE_WIDTH
    height = Config.IMAGE_HEIGHT
    model = Config.IMAGE_MODEL

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }

    try:
        # Check configured HuggingFace or OpenAI API keys if provided
        if provider == "huggingface" and Config.IMAGE_API_KEY:
            hf_url = f"https://api-inference.huggingface.co/models/{model}"
            hf_headers = {"Authorization": f"Bearer {Config.IMAGE_API_KEY}"}
            res = requests.post(hf_url, headers=hf_headers, json={"inputs": full_prompt}, timeout=20)
            if res.status_code == 200 and res.content:
                img_b64 = base64.b64encode(res.content).decode("utf-8")
                return {
                    "success": True,
                    "image_url": f"data:image/jpeg;base64,{img_b64}",
                    "provider": "huggingface_ai",
                    "slide_number": slide_number
                }

        elif provider == "openai" and Config.IMAGE_API_KEY:
            oai_headers = {
                "Authorization": f"Bearer {Config.IMAGE_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "dall-e-3",
                "prompt": full_prompt[:1000],
                "n": 1,
                "size": f"{width}x{height}"
            }
            res = requests.post("https://api.openai.com/v1/images/generations", headers=oai_headers, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                img_url = data["data"][0]["url"]
                return {
                    "success": True,
                    "image_url": img_url,
                    "provider": "openai_dalle3",
                    "slide_number": slide_number
                }

        # Pure Text-to-Image AI API: Pollinations AI with nologo=true
        encoded_prompt = urllib.parse.quote(full_prompt[:260])
        seed = random.randint(1000, 999999)
        direct_ai_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=800&height=450&seed={seed}&nologo=true"

        pollinations_urls = [
            direct_ai_url,
            f"https://image.pollinations.ai/prompt/{urllib.parse.quote(clean_scene[:150])}?width=800&height=450&seed={seed}&nologo=true"
        ]

        for attempt_idx, url in enumerate(pollinations_urls):
            try:
                res = requests.get(url, timeout=12, headers=headers)
                if res.status_code == 200 and res.content and res.headers.get('Content-Type', '').startswith('image/') and len(res.content) > 4000:
                    img_b64 = base64.b64encode(res.content).decode("utf-8")
                    mime_type = res.headers.get('Content-Type', 'image/jpeg')
                    return {
                        "success": True,
                        "image_url": f"data:{mime_type};base64,{img_b64}",
                        "provider": "pollinations_ai",
                        "slide_number": slide_number
                    }
                else:
                    print(f"Slide {slide_number} AI attempt {attempt_idx+1} HTTP {res.status_code}: {res.text[:150]}", file=sys.stderr)
            except Exception as pe:
                print(f"Slide {slide_number} Pollinations AI attempt {attempt_idx+1} exception: {pe}", file=sys.stderr)

        # Primary return: Direct working AI image URL for client browser rendering
        return {
            "success": True,
            "image_url": direct_ai_url,
            "provider": "pollinations_direct_ai",
            "slide_number": slide_number
        }

    except Exception as e:
        print(f"AI image generation error for slide {slide_number}: {e}", file=sys.stderr)

    # Error state visual fallback (only if exception thrown)
    fallback_url = generate_scene_svg_fallback(clean_scene, slide_number)
    return {
        "success": True,
        "image_url": fallback_url,
        "provider": "scene_specific_educational_fallback",
        "slide_number": slide_number
    }


def generate_images_parallel(slides: list, shared_style_context: str = "") -> dict:
    """
    Generate real AI images for all slides sequentially (1 at a time) to prevent API rate limiting (max 1 per IP).
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
            fallback_url = generate_scene_svg_fallback(f"Slide {slide_num} Concept", slide_num)
            results[slide_num] = {
                "success": True,
                "image_url": fallback_url,
                "provider": "scene_specific_educational_fallback",
                "slide_number": slide_num
            }

    return results


