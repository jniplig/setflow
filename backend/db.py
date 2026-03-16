"""
db.py
Handles Engine DJ SQLite database connection and path resolution.
Supports multiple databases (main library + external drives).
"""

import sqlite3
import os
from pathlib import Path


def get_db_paths() -> list[Path]:
    """
    Returns all Engine DJ database paths found on the system.
    Checks the Windows default location plus all drive letters D-Z.
    Override with ENGINE_DB_PATH env var (semicolon-separated for multiple).
    """
    env_override = os.environ.get("ENGINE_DB_PATH")
    if env_override:
        return [Path(p) for p in env_override.split(";") if Path(p).exists()]

    candidates = [
        Path.home() / "Music" / "Engine Library" / "Database2" / "m.db"
    ]

    for letter in "DEFGHIJKLMNOPQRSTUVWXYZ":
        candidates.append(Path(f"{letter}:\\Engine Library\\Database2\\m.db"))

    return [p for p in candidates if p.exists()]


def get_connections() -> list[sqlite3.Connection]:
    """
    Opens read-only connections to all discovered Engine DJ databases.
    Raises FileNotFoundError if none are found.
    """
    paths = get_db_paths()

    if not paths:
        raise FileNotFoundError(
            "No Engine DJ databases found. "
            "Ensure Engine DJ is installed and a library exists. "
            "Set ENGINE_DB_PATH to override (semicolon-separated for multiple)."
        )

    conns = []
    for path in paths:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        conns.append(conn)

    return conns


def get_primary_db_path() -> Path:
    """Returns the primary (main library) Engine DJ database path for writing."""
    paths = get_db_paths()
    if not paths:
        raise FileNotFoundError(
            "No Engine DJ databases found. "
            "Ensure Engine DJ is installed and a library exists."
        )
    return paths[0]


def get_write_connection() -> sqlite3.Connection:
    """Opens a writable connection to the primary Engine DJ database."""
    path = get_primary_db_path()
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def get_db_uuid_for_track_ids(track_ids: list[int]) -> dict[int, str]:
    """
    Returns {track_id: database_uuid} for each track_id by scanning all
    discovered databases. Tracks from external drives get their drive's UUID.
    """
    paths = get_db_paths()
    result: dict[int, str] = {}

    for path in paths:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        try:
            uuid_row = conn.execute("SELECT uuid FROM Information LIMIT 1").fetchone()
            if not uuid_row:
                continue
            db_uuid = uuid_row["uuid"]

            placeholders = ",".join("?" * len(track_ids))
            rows = conn.execute(
                f"SELECT id FROM Track WHERE id IN ({placeholders})",
                track_ids,
            ).fetchall()

            for row in rows:
                result[row["id"]] = db_uuid
        finally:
            conn.close()

    return result
