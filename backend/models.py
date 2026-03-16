"""
models.py
Pydantic response models for the Setflow API.
"""

from pydantic import BaseModel
from typing import Optional


# Camelot wheel mapping from Engine DJ integer key encoding
CAMELOT_MAP: dict[int, str] = {
    0: "1A",  1: "1B",  2: "2A",  3: "2B",
    4: "3A",  5: "3B",  6: "4A",  7: "4B",
    8: "5A",  9: "5B", 10: "6A", 11: "6B",
    12: "7A", 13: "7B", 14: "8A", 15: "8B",
    16: "9A", 17: "9B", 18: "10A", 19: "10B",
    20: "11A", 21: "11B", 22: "12A", 23: "12B"
}


def resolve_key(raw_key: Optional[int]) -> Optional[str]:
    """Converts Engine DJ integer key to Camelot notation."""
    if raw_key is None:
        return None
    return CAMELOT_MAP.get(raw_key, f"Unknown ({raw_key})")


def format_duration(seconds: Optional[int]) -> Optional[str]:
    """Converts duration in seconds to mm:ss string."""
    if seconds is None:
        return None
    mins, secs = divmod(int(seconds), 60)
    return f"{mins}:{secs:02d}"


class Track(BaseModel):
    id: int
    title: Optional[str] = None
    artist: Optional[str] = None
    bpm: Optional[float] = None
    key: Optional[str] = None          # Camelot notation e.g. "8A"
    duration_seconds: Optional[int] = None
    duration_formatted: Optional[str] = None  # mm:ss
    genre: Optional[str] = None
    filename: Optional[str] = None
