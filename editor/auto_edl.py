"""Auto-generate EDL from ElevenLabs transcript by cutting silences and repetitions.

Reuses video-use's phrase-grouping logic so silence detection is identical to
the packed transcript the human editor reads.
"""

from __future__ import annotations

import json
import sys
from difflib import SequenceMatcher
from pathlib import Path

# Reuse video-use phrase grouping — same logic as takes_packed.md
sys.path.insert(0, str(Path(__file__).parent.parent / "video-use" / "helpers"))
from pack_transcripts import group_into_phrases  # noqa: E402

SILENCE_THRESHOLD = 0.5      # gaps >= this (seconds) are cut
REPETITION_THRESHOLD = 0.72  # text similarity ratio to flag a repetition
MIN_SEGMENT_DURATION = 0.4   # discard segments shorter than this
EDGE_PAD = 0.03              # 30ms padding aligns with render.py audio fades
MERGE_GAP = 0.15             # merge adjacent segments separated by < this


def _text_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower().split(), b.lower().split()).ratio()


def _find_repetitions(phrases: list[dict], window: int = 8) -> set[int]:
    """Return indices of phrases that duplicate an earlier phrase within `window`."""
    repeated: set[int] = set()
    for i in range(len(phrases)):
        for j in range(max(0, i - window), i):
            if j in repeated:
                continue
            if _text_similarity(phrases[i]["text"], phrases[j]["text"]) >= REPETITION_THRESHOLD:
                repeated.add(i)
                break
    return repeated


def _merge_close(ranges: list[dict], gap: float = MERGE_GAP) -> list[dict]:
    """Merge adjacent EDL ranges that are separated by less than `gap` seconds."""
    if not ranges:
        return []
    merged = [ranges[0].copy()]
    for r in ranges[1:]:
        if r["start"] - merged[-1]["end"] <= gap:
            merged[-1]["end"] = r["end"]
            q = (merged[-1].get("quote", "") + " " + r.get("quote", "")).strip()
            merged[-1]["quote"] = q[:120]
        else:
            merged.append(r.copy())
    return merged


def generate_edl(
    transcript_path: Path,
    source_video: Path,
    silence_threshold: float = SILENCE_THRESHOLD,
) -> dict:
    """Build an EDL dict from a Scribe JSON transcript.

    Removes silence gaps >= silence_threshold and repeated phrases
    (>= 72% text similarity within the last 8 phrases).
    """
    data = json.loads(transcript_path.read_text())
    words = data.get("words", [])
    phrases = group_into_phrases(words, silence_threshold)

    repetitions = _find_repetitions(phrases)
    print(f"  {len(phrases)} phrases found, {len(repetitions)} repetition(s) removed")

    ranges = []
    for i, p in enumerate(phrases):
        if i in repetitions:
            continue
        duration = p["end"] - p["start"]
        if duration < MIN_SEGMENT_DURATION:
            continue
        start = max(0.0, p["start"] - EDGE_PAD)
        end = p["end"] + EDGE_PAD
        ranges.append({
            "source": source_video.stem,
            "start": round(start, 3),
            "end": round(end, 3),
            "beat": f"phrase_{i:03d}",
            "quote": p["text"][:100],
            "reason": "auto",
        })

    ranges = _merge_close(ranges)
    total_s = sum(r["end"] - r["start"] for r in ranges)

    return {
        "version": 1,
        "sources": {source_video.stem: str(source_video.resolve())},
        "ranges": ranges,
        "grade": "subtle",
        "overlays": [],
        "subtitles": None,
        "total_duration_s": round(total_s, 2),
    }
