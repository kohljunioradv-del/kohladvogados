"""Video editing pipeline: video-use (cuts) + hyperframes (animations).

Steps
-----
1. Transcribe  — ElevenLabs Scribe, word-level timestamps, speaker diarization
2. Pack        — phrase-level takes_packed.md (same format as video-use skill)
3. Auto EDL    — cut silence gaps and repeated phrases automatically
4. Animations  — generate contextual Hyperframes overlays (title card + lower thirds)
5. Render      — final MP4 via video-use render.py (grade + loudnorm + subtitles)

Usage
-----
    python editor/pipeline.py <video.mp4>
    python editor/pipeline.py <video.mp4> --language pt --subtitles
    python editor/pipeline.py <video.mp4> --skip-transcribe   # reuse cached transcript
    python editor/pipeline.py <video.mp4> --skip-animations   # cuts only
    python editor/pipeline.py <video.mp4> --preview           # fast QC render

Environment
-----------
    ELEVENLABS_API_KEY  required for step 1 (or pass --api-key)
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.resolve()
VIDEO_USE_HELPERS = ROOT / "video-use" / "helpers"
HYPERFRAMES_DIR = ROOT / "hyperframes"
EDITOR_DIR = Path(__file__).parent.resolve()


def _step(n: int, msg: str) -> None:
    print(f"\n[{n}/5] {msg}", flush=True)


def _run(cmd: list[str | Path], **kwargs) -> None:
    print(f"  $ {' '.join(str(c) for c in cmd)}", flush=True)
    subprocess.run(cmd, check=True, **kwargs)


# ---------------------------------------------------------------------------
# Step 1 — Transcribe
# ---------------------------------------------------------------------------

def transcribe(video: Path, edit_dir: Path, api_key: str, language: str | None) -> Path:
    out = edit_dir / "transcripts" / f"{video.stem}.json"
    if out.exists():
        print(f"  cached → {out.name}")
        return out
    cmd = [sys.executable, str(VIDEO_USE_HELPERS / "transcribe.py"), str(video),
           "--edit-dir", str(edit_dir)]
    if language:
        cmd += ["--language", language]
    _run(cmd, env={**os.environ, "ELEVENLABS_API_KEY": api_key})
    return out


# ---------------------------------------------------------------------------
# Step 2 — Pack transcript
# ---------------------------------------------------------------------------

def pack_transcript(edit_dir: Path, silence_threshold: float) -> None:
    _run([sys.executable, str(VIDEO_USE_HELPERS / "pack_transcripts.py"),
          "--edit-dir", str(edit_dir),
          "--silence-threshold", str(silence_threshold)])


# ---------------------------------------------------------------------------
# Step 3 — Auto EDL
# ---------------------------------------------------------------------------

def build_auto_edl(transcript_path: Path, video: Path, silence_threshold: float) -> tuple[Path, dict]:
    sys.path.insert(0, str(EDITOR_DIR))
    from auto_edl import generate_edl  # noqa: PLC0415

    edl = generate_edl(transcript_path, video, silence_threshold)
    edl_path = transcript_path.parent.parent / "edl.json"
    edl_path.write_text(json.dumps(edl, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  {len(edl['ranges'])} ranges  →  {edl['total_duration_s']:.1f}s")
    return edl_path, edl


# ---------------------------------------------------------------------------
# Step 4 — Animations
# ---------------------------------------------------------------------------

def add_animations(edl: dict, edl_path: Path, edit_dir: Path) -> None:
    sys.path.insert(0, str(EDITOR_DIR))
    from animation_gen import generate_all_animations  # noqa: PLC0415

    overlays = generate_all_animations(
        packed_transcript=edit_dir / "takes_packed.md",
        edit_dir=edit_dir,
        hyperframes_dir=HYPERFRAMES_DIR,
        total_duration_s=edl.get("total_duration_s", 0.0),
    )
    if overlays:
        edl["overlays"] = overlays
        edl_path.write_text(json.dumps(edl, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  {len(overlays)} overlay(s) added to EDL")


# ---------------------------------------------------------------------------
# Step 5 — Final render
# ---------------------------------------------------------------------------

def render_final(edl_path: Path, output: Path, preview: bool, subtitles: bool) -> None:
    cmd = [sys.executable, str(VIDEO_USE_HELPERS / "render.py"),
           str(edl_path), "-o", str(output)]
    if preview:
        cmd.append("--preview")
    if subtitles:
        cmd.append("--build-subtitles")
    _run(cmd)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Video editing pipeline: silence/repetition cuts + contextual animations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument("video", type=Path, help="Input video file")
    ap.add_argument(
        "--silence-threshold", type=float, default=0.5, metavar="SEC",
        help="Cut silence gaps >= this value in seconds (default: 0.5)",
    )
    ap.add_argument(
        "--language", type=str, default=None,
        help="Transcript language code, e.g. pt, en, es (auto-detect if omitted)",
    )
    ap.add_argument(
        "--api-key", type=str, default=None,
        help="ElevenLabs API key (default: $ELEVENLABS_API_KEY)",
    )
    ap.add_argument(
        "--skip-transcribe", action="store_true",
        help="Reuse existing cached transcript (skip API call)",
    )
    ap.add_argument(
        "--skip-animations", action="store_true",
        help="Skip Hyperframes animation generation (cuts only)",
    )
    ap.add_argument(
        "--preview", action="store_true",
        help="Faster render at lower quality — good for checking cuts",
    )
    ap.add_argument(
        "--subtitles", action="store_true",
        help="Burn auto-generated subtitles into the final video",
    )
    args = ap.parse_args()

    video = args.video.resolve()
    if not video.exists():
        sys.exit(f"error: video not found — {video}")

    api_key = args.api_key or os.environ.get("ELEVENLABS_API_KEY", "")
    edit_dir = video.parent / "edit"
    edit_dir.mkdir(parents=True, exist_ok=True)

    print(f"video : {video.name}")
    print(f"edit  : {edit_dir}")

    # 1. Transcribe
    _step(1, "Transcribing audio (ElevenLabs Scribe)")
    if not args.skip_transcribe and not api_key:
        sys.exit("error: ELEVENLABS_API_KEY required (or pass --api-key or --skip-transcribe)")
    transcript_path = transcribe(video, edit_dir, api_key, args.language)

    # 2. Pack
    _step(2, "Packing transcript into phrase-level markdown")
    pack_transcript(edit_dir, args.silence_threshold)

    # 3. Auto EDL
    _step(3, "Building EDL — cutting silences and repetitions")
    edl_path, edl = build_auto_edl(transcript_path, video, args.silence_threshold)

    # 4. Animations
    if not args.skip_animations:
        _step(4, "Generating contextual Hyperframes animations")
        add_animations(edl, edl_path, edit_dir)
    else:
        _step(4, "Skipping animations (--skip-animations)")

    # 5. Render
    _step(5, "Rendering final video")
    suffix = "_preview" if args.preview else "_final"
    output = edit_dir / f"{video.stem}{suffix}.mp4"
    render_final(edl_path, output, args.preview, args.subtitles)

    size_mb = output.stat().st_size / 1_048_576
    print(f"\ndone → {output}  ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
