# Setflow

A desktop DJ set planning application powered by your Engine DJ library.

Browse your full track library, build setlists, and plan DJ sets — all connected directly to the Engine DJ SQLite database on your machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python · FastAPI · SQLite |
| Frontend | React · TypeScript (Phase 2) |
| Desktop Shell | Electron (Phase 4) |

---

## Project Status

| Phase | Description | Status |
|---|---|---|
| 1 | FastAPI backend — library reader + `/tracks` API | ✅ Complete |
| 2 | React UI — library browser | 🔜 Planned |
| 3 | Setlist builder — drag-and-drop | 🔜 Planned |
| 4 | Electron wrapper — desktop packaging | 🔜 Planned |
| 5 | Export to Engine DJ playlist | 🔜 Planned |

---

## Requirements

- Python 3.11+
- Engine DJ Desktop app installed with a populated library
- Windows (default path auto-detected; see below for macOS/override)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/setflow.git
cd setflow
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
```

### 3. Install dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. (Optional) Override the database path

By default, Setflow looks for your Engine DJ library at:

```
C:\Users\<you>\Music\Engine Library\Database2\m.db
```

To use a different path (e.g. external drive), set the environment variable:

```bash
set ENGINE_DB_PATH=D:\Engine Library\Database2\m.db
```

---

## Running the API

```bash
uvicorn backend.main:app --reload
```

The API will be available at: `http://localhost:8000`

Interactive docs (Swagger UI): `http://localhost:8000/docs`

---

## API Endpoints

### `GET /tracks`

Returns tracks from your library. Supports query parameters:

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Search by title or artist |
| `genre` | string | Filter by genre |
| `min_bpm` | float | Minimum BPM |
| `max_bpm` | float | Maximum BPM |
| `limit` | int | Max results (default 100, max 500) |
| `offset` | int | Pagination offset |

**Example:**
```
GET /tracks?search=disclosure&min_bpm=120&max_bpm=130
```

### `GET /tracks/{id}`

Returns a single track by its Engine DJ ID.

### `GET /health`

Health check.

---

## Engine DJ Database Notes

- Setflow connects in **read-only mode** — your library is never modified.
- The database is located at `Music/Engine Library/Database2/m.db`.
- Musical key is stored as an integer and converted to **Camelot wheel notation** (e.g. `8A`, `5B`).
- Track duration is returned as both raw seconds and formatted `mm:ss`.

---

## License

MIT
