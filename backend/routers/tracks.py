"""
routers/tracks.py
Endpoints for browsing and searching the Engine DJ track library.
Merges results from all discovered Engine DJ databases (main + external drives).
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.db import get_connections
from backend.models import Track, resolve_key, format_duration

router = APIRouter(prefix="/tracks", tags=["tracks"])


def _build_filter_query(search, genre, min_bpm, max_bpm) -> tuple[str, list]:
    """Shared WHERE clause builder used by both count and fetch queries."""
    where  = "WHERE 1=1"
    params: list = []

    if search:
        where += " AND (title LIKE ? OR artist LIKE ?)"
        params += [f"%{search}%", f"%{search}%"]
    if genre:
        where += " AND genre LIKE ?"
        params.append(f"%{genre}%")
    if min_bpm is not None:
        where += " AND bpm >= ?"
        params.append(min_bpm)
    if max_bpm is not None:
        where += " AND bpm <= ?"
        params.append(max_bpm)

    return where, params


@router.get("/count")
def get_track_count(
    search: Optional[str]    = Query(None),
    genre: Optional[str]     = Query(None),
    min_bpm: Optional[float] = Query(None),
    max_bpm: Optional[float] = Query(None),
):
    """Returns the total number of matching tracks across all databases."""
    try:
        conns = get_connections()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    where, params = _build_filter_query(search, genre, min_bpm, max_bpm)
    total = 0
    for conn in conns:
        total += conn.execute(f"SELECT COUNT(*) FROM Track {where}", params).fetchone()[0]
        conn.close()

    return {"count": total}


SORT_COLUMN_MAP = {
    "title":    "title",
    "artist":   "artist",
    "genre":    "genre",
    "bpm":      "bpm",
    "key":      "key",
    "duration": "length",
}


@router.get("/", response_model=list[Track])
def get_tracks(
    search: Optional[str]    = Query(None, description="Search title or artist"),
    genre: Optional[str]     = Query(None, description="Filter by genre"),
    min_bpm: Optional[float] = Query(None, description="Minimum BPM"),
    max_bpm: Optional[float] = Query(None, description="Maximum BPM"),
    limit: int               = Query(100, le=2000, description="Max results to return"),
    offset: int              = Query(0, description="Pagination offset"),
    sort_by: str             = Query("artist", description="Column to sort by"),
    sort_dir: str            = Query("asc", description="Sort direction: asc or desc"),
):
    """
    Returns tracks merged from all discovered Engine DJ databases.
    All matching rows are fetched and merged first, THEN paginated —
    this ensures correct results when spanning multiple databases.
    """
    try:
        conns = get_connections()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    db_col   = SORT_COLUMN_MAP.get(sort_by, "artist")
    reverse  = sort_dir.lower() == "desc"

    where, params = _build_filter_query(search, genre, min_bpm, max_bpm)
    query = f"""
        SELECT id, title, artist, bpm, key, length, genre, filename
        FROM Track {where}
    """

    # Fetch all matching rows from every DB, deduplicate, then paginate
    all_rows = []
    seen_keys = set()

    for conn in conns:
        for row in conn.execute(query, params).fetchall():
            dedup_key = (row["title"], row["artist"])
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                all_rows.append(row)
        conn.close()

    # Sort merged results and apply pagination here
    all_rows.sort(
        key=lambda r: (r[db_col] is None, r[db_col] if r[db_col] is not None else ""),
        reverse=reverse,
    )
    paginated = all_rows[offset: offset + limit]

    return [
        Track(
            id=row["id"],
            title=row["title"],
            artist=row["artist"],
            bpm=row["bpm"],
            key=resolve_key(row["key"]),
            duration_seconds=row["length"],
            duration_formatted=format_duration(row["length"]),
            genre=row["genre"],
            filename=row["filename"],
        )
        for row in paginated
    ]


@router.get("/{track_id}", response_model=Track)
def get_track(track_id: int):
    """Returns a single track by its Engine DJ ID, checking all databases."""
    try:
        conns = get_connections()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))

    for conn in conns:
        row = conn.execute(
            "SELECT id, title, artist, bpm, key, length, genre, filename FROM Track WHERE id = ?",
            [track_id]
        ).fetchone()
        conn.close()
        if row:
            return Track(
                id=row["id"],
                title=row["title"],
                artist=row["artist"],
                bpm=row["bpm"],
                key=resolve_key(row["key"]),
                duration_seconds=row["length"],
                duration_formatted=format_duration(row["length"]),
                genre=row["genre"],
                filename=row["filename"],
            )

    raise HTTPException(status_code=404, detail=f"Track {track_id} not found")
