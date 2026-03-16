"""
audio.py
Resolves bare Engine DJ filenames to full file system paths.
Searches known Engine Library Music folders recursively.
"""

import os
from pathlib import Path
from functools import lru_cache


# Known music root directories — scanned in order
MUSIC_ROOTS: list[Path] = [
    Path(r"D:\Engine Library\Music"),
    Path.home() / "Music" / "Engine Library" / "Music",
]

# Additional roots can be added via environment variable (semicolon-separated)
_env_roots = os.environ.get("ENGINE_MUSIC_ROOTS", "")
if _env_roots:
    MUSIC_ROOTS = [Path(p) for p in _env_roots.split(";") if Path(p).exists()] + MUSIC_ROOTS


@lru_cache(maxsize=2048)
def resolve_audio_path(filename: str) -> Path | None:
    """
    Searches all known music roots recursively for a bare filename.
    Results are cached so repeated lookups are instant.
    Returns None if the file cannot be found.
    """
    for root in MUSIC_ROOTS:
        if not root.exists():
            continue
        for dirpath, _, filenames in os.walk(root):
            if filename in filenames:
                return Path(dirpath) / filename

    return None
