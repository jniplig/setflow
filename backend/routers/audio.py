"""
routers/audio.py
Streams audio files for track preview.
Supports HTTP range requests so the browser scrubber works correctly.
"""

import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from backend.db import get_connections
from backend.audio import resolve_audio_path

router = APIRouter(prefix="/tracks", tags=["audio"])

CHUNK_SIZE = 1024 * 256  # 256 KB chunks

MIME_TYPES: dict[str, str] = {
    ".mp3":  "audio/mpeg",
    ".flac": "audio/flac",
    ".wav":  "audio/wav",
    ".aiff": "audio/aiff",
    ".aif":  "audio/aiff",
    ".m4a":  "audio/mp4",
    ".aac":  "audio/aac",
    ".ogg":  "audio/ogg",
}


def _get_filename(track_id: int) -> str | None:
    """Looks up the bare filename for a track ID across all databases."""
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


@router.get("/{track_id}/audio")
async def stream_audio(track_id: int, request: Request):
    """
    Streams an audio file with HTTP range request support.
    Range support is required for the browser scrubber to work.
    """
    filename = _get_filename(track_id)
    if not filename:
        raise HTTPException(status_code=404, detail="Track not found")

    file_path = resolve_audio_path(filename)
    if not file_path:
        raise HTTPException(
            status_code=404,
            detail=f"Audio file not found on disk: {filename}"
        )

    suffix      = Path(filename).suffix.lower()
    media_type  = MIME_TYPES.get(suffix, "application/octet-stream")
    file_size   = file_path.stat().st_size

    # Parse Range header if present
    range_header = request.headers.get("range")

    if range_header:
        # e.g. "bytes=0-1048575"
        range_val   = range_header.strip().replace("bytes=", "")
        start_str, _, end_str = range_val.partition("-")
        start = int(start_str) if start_str else 0
        end   = int(end_str)   if end_str   else file_size - 1
        end   = min(end, file_size - 1)
        length = end - start + 1

        def iter_range():
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            iter_range(),
            status_code=206,
            media_type=media_type,
            headers={
                "Content-Range":  f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges":  "bytes",
                "Content-Length": str(length),
            }
        )

    # No range — stream the whole file
    def iter_file():
        with open(file_path, "rb") as f:
            while chunk := f.read(CHUNK_SIZE):
                yield chunk

    return StreamingResponse(
        iter_file(),
        media_type=media_type,
        headers={
            "Accept-Ranges":  "bytes",
            "Content-Length": str(file_size),
        }
    )
