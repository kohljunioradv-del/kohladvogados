"""Generate contextual Hyperframes animations and render them to WebM with alpha.

Reads takes_packed.md to extract:
  - The video title (first phrase)
  - Topic keywords (most-frequent non-stopwords)
  - Lower-third candidates (long phrases)

Generates Hyperframes HTML compositions and renders each to a .webm with a
transparent background so they alpha-composite cleanly over the edited footage
via render.py's existing overlay filter.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "could", "should", "may",
    "might", "that", "this", "it", "its", "i", "you", "he", "she", "we", "they",
    "my", "your", "our", "their", "what", "which", "who", "how", "when", "where",
    "not", "no", "so", "as", "if", "by", "from", "up", "about", "into", "through",
    "just", "also", "very", "really", "like", "get", "got", "go", "going", "um",
    "uh", "yeah", "okay", "ok", "right", "know", "think", "want", "need",
}


# ---------------------------------------------------------------------------
# Context extraction
# ---------------------------------------------------------------------------

def _extract_context(packed_md: Path) -> dict:
    """Parse takes_packed.md and return title, subtitle topics, and lower-third phrases."""
    text = packed_md.read_text(encoding="utf-8")
    phrases = re.findall(r'\[\d+\.\d+-\d+\.\d+\](?:\s+S\w+)?\s+(.+)', text)

    if not phrases:
        return {"title": "Video", "subtitle": "", "lower_thirds": []}

    # First phrase as title candidate
    title = phrases[0].strip()
    if len(title) > 65:
        title = title[:62] + "..."

    # Most-frequent non-stopwords as topic keywords
    all_text = " ".join(phrases).lower()
    freq: dict[str, int] = {}
    for w in re.findall(r"[a-záàãâéêíóôõúç']+", all_text):
        if w not in STOPWORDS and len(w) > 3:
            freq[w] = freq.get(w, 0) + 1
    topics = sorted(freq, key=freq.__getitem__, reverse=True)[:4]

    # Long phrases (8+ words, not the first) as lower-third candidates
    lower_thirds = []
    for p in phrases[1:]:
        if len(p.strip().split()) >= 8:
            lower_thirds.append(p.strip())
        if len(lower_thirds) >= 3:
            break

    return {
        "title": title,
        "subtitle": "  ·  ".join(topics[:3]).upper() if topics else "",
        "lower_thirds": lower_thirds,
    }


# ---------------------------------------------------------------------------
# HTML template writers
# ---------------------------------------------------------------------------

def _write_title_card(path: Path, title: str, subtitle: str, duration: float = 4.0) -> None:
    """Full-frame title card with dark gradient overlay and GSAP entrance."""
    # Escape HTML special chars
    title = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    subtitle = subtitle.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    path.write_text(f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1920px; height: 1080px; overflow: hidden; background: transparent; }}
#stage {{ width: 1920px; height: 1080px; position: relative; }}
#bg {{ position: absolute; inset: 0; background: linear-gradient(160deg, rgba(0,0,0,0.84) 0%, rgba(10,10,30,0.80) 100%); }}
#wrap {{ position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; width: 1400px; }}
#title-el {{ font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 84px; font-weight: 800; color: #fff; line-height: 1.1; letter-spacing: -0.02em; }}
#bar-el {{ width: 72px; height: 5px; background: #e63939; margin: 28px auto; transform-origin: left center; }}
#sub-el {{ font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: 0.08em; }}
</style>
</head>
<body>
  <div id="stage" data-composition-id="title-card" data-width="1920" data-height="1080" data-duration="{duration}">
    <div id="bg"     data-start="0" data-duration="{duration}" data-track-index="0"></div>
    <div id="wrap"   data-start="0" data-duration="{duration}" data-track-index="1">
      <div id="title-el">{title}</div>
      <div id="bar-el"></div>
      <div id="sub-el">{subtitle}</div>
    </div>
  </div>
  <script>
    window.__hfGsap = (gsap) => {{
      const tl = gsap.timeline({{ paused: true }});
      tl.from('#bg',       {{ duration: 0.6, opacity: 0 }});
      tl.from('#title-el', {{ duration: 0.7, y: 50, opacity: 0, ease: 'power3.out' }}, 0.2);
      tl.from('#bar-el',   {{ duration: 0.4, scaleX: 0, opacity: 0, ease: 'power2.out' }}, 0.7);
      tl.from('#sub-el',   {{ duration: 0.5, y: 20, opacity: 0, ease: 'power2.out' }}, 0.9);
      tl.to('#wrap',       {{ duration: 0.5, opacity: 0, ease: 'power2.in' }}, {duration - 0.6});
      tl.to('#bg',         {{ duration: 0.5, opacity: 0, ease: 'power2.in' }}, {duration - 0.5});
      return tl;
    }};
  </script>
</body>
</html>
""", encoding="utf-8")


def _write_lower_third(path: Path, text: str, duration: float = 3.5) -> None:
    """Bottom-left lower third with slide-in/out GSAP animation, transparent background."""
    display = (text[:70] + "…" if len(text) > 70 else text).upper()
    display = display.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    path.write_text(f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1920px; height: 1080px; overflow: hidden; background: transparent; }}
#stage {{ width: 1920px; height: 1080px; position: relative; }}
#lt {{ position: absolute; bottom: 130px; left: 80px; }}
#bar {{ display: inline-flex; align-items: center; background: rgba(0,0,0,0.80); padding: 14px 28px; border-left: 5px solid #e63939; }}
#text-el {{ font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 700; color: #fff; letter-spacing: 0.03em; white-space: nowrap; }}
</style>
</head>
<body>
  <div id="stage" data-composition-id="lower-third" data-width="1920" data-height="1080" data-duration="{duration}">
    <div id="lt" data-start="0" data-duration="{duration}" data-track-index="0">
      <div id="bar">
        <div id="text-el">{display}</div>
      </div>
    </div>
  </div>
  <script>
    window.__hfGsap = (gsap) => {{
      const tl = gsap.timeline({{ paused: true }});
      tl.from('#lt', {{ duration: 0.35, x: -100, opacity: 0, ease: 'power2.out' }});
      tl.to('#lt',   {{ duration: 0.35, x: -100, opacity: 0, ease: 'power2.in' }}, {duration - 0.4});
      return tl;
    }};
  </script>
</body>
</html>
""", encoding="utf-8")


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def _render_html(html_path: Path, output_path: Path, hyperframes_dir: Path) -> bool:
    """Render a Hyperframes HTML file via the CLI (bun + TypeScript source)."""
    cli_ts = hyperframes_dir / "packages" / "cli" / "src" / "cli.ts"
    fmt = "webm" if output_path.suffix == ".webm" else "mp4"

    cmd = ["bun", str(cli_ts), "render", str(html_path), "-o", str(output_path), "--format", fmt]
    print(f"  rendering {html_path.name} → {output_path.name}")

    result = subprocess.run(cmd, cwd=str(hyperframes_dir), capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ! render failed: {result.stderr[-400:].strip()}")
        return False
    return True


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_all_animations(
    packed_transcript: Path,
    edit_dir: Path,
    hyperframes_dir: Path,
    total_duration_s: float = 0.0,
) -> list[dict]:
    """Generate + render all animations. Returns EDL overlay specs."""
    if not packed_transcript.exists():
        print("  no packed transcript — skipping animations")
        return []

    ctx = _extract_context(packed_transcript)
    anim_dir = edit_dir / "animations"
    anim_dir.mkdir(exist_ok=True)

    overlays: list[dict] = []

    # Title card at t=0
    title_html = anim_dir / "title_card.html"
    title_out = anim_dir / "title_card.webm"
    _write_title_card(title_html, ctx["title"], ctx["subtitle"], duration=4.0)
    if _render_html(title_html, title_out, hyperframes_dir):
        overlays.append({"file": str(title_out), "start_in_output": 0.0, "duration": 4.0})

    # Lower thirds spread evenly through the video
    n = len(ctx["lower_thirds"])
    for i, phrase in enumerate(ctx["lower_thirds"]):
        lt_html = anim_dir / f"lower_third_{i + 1}.html"
        lt_out = anim_dir / f"lower_third_{i + 1}.webm"
        _write_lower_third(lt_html, phrase, duration=3.5)
        if _render_html(lt_html, lt_out, hyperframes_dir):
            t = total_duration_s * (i + 1) / (n + 1) if total_duration_s > 0 else 12.0 * (i + 1)
            overlays.append({"file": str(lt_out), "start_in_output": round(t, 2), "duration": 3.5})

    print(f"  {len(overlays)} animation overlay(s) ready")
    return overlays
