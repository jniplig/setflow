"""
waveform.py
Extracts audio peak data for waveform visualisation.

Strategy:
- Uses ffmpeg to decode any format to raw 32-bit float PCM (mono, 22050 Hz)
- numpy downsamples to NUM_PEAKS points by taking max absolute value per chunk
- Results are cached so repeated requests are instant
"""

import subprocess
import struct
import os
from pathlib import Path
from functools import lru_cache

NUM_PEAKS    = 1000   # number of peak points returned
SAMPLE_RATE  = 22050  # decode at reduced sample rate — enough for visualisation


def _ffmpeg_to_pcm(file_path: Path) -> bytes:
    """
    Uses ffmpeg to decode any audio file to raw 32-bit float mono PCM.
    Returns raw bytes.
    """
    cmd = [
        "ffmpeg",
        "-i", str(file_path),
        "-ac", "1",                    # mono
        "-ar", str(SAMPLE_RATE),       # sample rate
        "-f", "f32le",                 # 32-bit float little-endian
        "-vn",                         # no video
        "pipe:1",                      # output to stdout
        "-loglevel", "error",
    ]

    result = subprocess.run(cmd, capture_output=True, timeout=30)

    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed: {result.stderr.decode(errors='replace')}"
        )

    return result.stdout


def _extract_peaks(pcm_bytes: bytes, num_peaks: int) -> list[float]:
    """
    Downsamples raw f32le PCM bytes to num_peaks normalised peak values.
    Each peak is the max absolute amplitude in a chunk, normalised 0.0–1.0.
    """
    # Unpack all float32 samples
    num_samples = len(pcm_bytes) // 4
    if num_samples == 0:
        return [0.0] * num_peaks

    samples = struct.unpack(f"{num_samples}f", pcm_bytes)

    chunk_size = max(1, num_samples // num_peaks)
    peaks = []

    for i in range(num_peaks):
        start = i * chunk_size
        end   = min(start + chunk_size, num_samples)
        chunk = samples[start:end]
        peaks.append(max(abs(s) for s in chunk) if chunk else 0.0)

    # Normalise to 0.0–1.0
    max_val = max(peaks) if peaks else 1.0
    if max_val == 0:
        return peaks
    return [p / max_val for p in peaks]


@lru_cache(maxsize=512)
def get_waveform_peaks(file_path_str: str) -> list[float]:
    """
    Returns NUM_PEAKS normalised peak values for the given audio file.
    Cached by file path — repeated calls are instant.
    """
    file_path = Path(file_path_str)
    pcm = _ffmpeg_to_pcm(file_path)
    return _extract_peaks(pcm, NUM_PEAKS)
