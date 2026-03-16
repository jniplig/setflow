"""
routers/waveform.py
Returns pre-computed waveform peak data for a track.
"""

from fastapi import APIRouter, HTTPException
from backend.db import get_connections
from backend.audio import resolve_audio_path
from backend.waveform import get_waveform_peaks

router = APIRouter(prefix="/tracks", tags=["waveform"])


def _get_filename(track_id: int) -> str | None:
    try:
        conns = get_connections()
    except FileNotFoundError:
        return None
    for conn in conns:
        row = conn.execute(
            "SELECT filename FROM Track WHERE id = ?", [track_id]
        ).fetchone()
        conn.close()
        if row and row["filename"]:
            return row["filename"]
    return None


@router.get("/{track_id}/waveform")
def get_waveform(track_id: int):
    """
    Returns waveform peak data for a track as a list of 1000 normalised floats (0.0–1.0).
    Results are cached server-side after first extraction.
    """
    filename = _get_filename(track_id)
    if not filename:
        raise HTTPException(status_code=404, detail="Track not found")

    file_path = resolve_audio_path(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")

    try:
        peaks = get_waveform_peaks(str(file_path))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Waveform extraction failed: {e}")

    return {"peaks": peaks, "count": len(peaks)}
