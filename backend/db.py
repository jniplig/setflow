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
