"""
routers/playlists.py
Endpoint for exporting a Setflow setlist to the Engine DJ playlist database.
"""

import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.db import get_write_connection, get_db_uuid_for_track_ids

router = APIRouter(prefix="/playlists", tags=["playlists"])


class ExportTrack(BaseModel):
    id: int


class ExportRequest(BaseModel):
    name: str
    tracks: list[ExportTrack]


@router.post("/export")
def export_to_engine(req: ExportRequest):
    """
    Creates a new playlist in the primary Engine DJ database.

    - Inserts a Playlist row and splices it into the root linked list
    - Inserts PlaylistEntity rows (one per track) chained into a linked list
    - Each entity's databaseUuid identifies which drive the track lives on,
      allowing Engine DJ to resolve tracks across external drives correctly
    """
    if not req.tracks:
        raise HTTPException(status_code=400, detail="Cannot export an empty setlist")

    track_ids = [t.id for t in req.tracks]

    # Resolve which database each track belongs to
    try:
        uuid_map = get_db_uuid_for_track_ids(track_ids)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    missing = [tid for tid in track_ids if tid not in uuid_map]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"Track IDs not found in any Engine DJ database: {missing}",
        )

    try:
        conn = get_write_connection()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        cursor = conn.cursor()
        now = int(time.time())

        # ── 1. Insert the new Playlist row ────────────────────────────────────
        cursor.execute(
            """
            INSERT INTO Playlist
              (title, parentListId, isPersisted, nextListId,
               lastEditTime, isExplicitlyExported)
            VALUES (?, 0, 1, 0, ?, 1)
            """,
            (req.name, now),
        )
        playlist_id = cursor.lastrowid

        # Splice into the root linked list: find the current last entry
        # (parentListId=0, nextListId=0) and point it to the new playlist.
        # Excludes the new playlist itself via id != ? so the condition is safe
        # even when this is the very first root playlist.
        cursor.execute(
            """
            UPDATE Playlist
            SET nextListId = ?
            WHERE parentListId = 0 AND nextListId = 0 AND id != ?
            """,
            (playlist_id, playlist_id),
        )

        # ── 2. Insert PlaylistEntity rows ──────────────────────────────────────
        entity_ids: list[int] = []
        for track_id in track_ids:
            cursor.execute(
                """
                INSERT INTO PlaylistEntity
                  (listId, trackId, databaseUuid, nextEntityId, membershipReference)
                VALUES (?, ?, ?, 0, 0)
                """,
                (playlist_id, track_id, uuid_map[track_id]),
            )
            entity_ids.append(cursor.lastrowid)

        # Chain entities into a linked list (last entity keeps nextEntityId=0)
        for i in range(len(entity_ids) - 1):
            cursor.execute(
                "UPDATE PlaylistEntity SET nextEntityId = ? WHERE id = ?",
                (entity_ids[i + 1], entity_ids[i]),
            )

        conn.commit()
        return {
            "playlist_id": playlist_id,
            "name": req.name,
            "track_count": len(track_ids),
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

    finally:
        conn.close()
