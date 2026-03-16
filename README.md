# Setflow

A desktop DJ set planning application powered by your Engine DJ library.

Browse your full track library, build setlists, and preview audio — all connected directly to the Engine DJ SQLite database on your machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Python · FastAPI · SQLite |
| Frontend | React · TypeScript · Tailwind CSS |
| Desktop Shell | Electron |

---

## Project Status

| Phase | Description | Status |
|---|---|---|
| 1 | FastAPI backend — library reader + `/tracks` API | ✅ Complete |
| 2 | React UI — library browser with search and filters | ✅ Complete |
| 3 | Setlist builder — drag-and-drop, localStorage persistence | ✅ Complete |
| 4 | Electron wrapper — desktop packaging + audio preview | ✅ Complete |
| 5 | Export to Engine DJ playlist | 🔜 Planned |

---

## Requirements

- Python 3.11+
- Node.js 18+
- Engine DJ Desktop app installed with a populated library
- Windows (default path auto-detected; see below for override)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/jniplig/setflow.git
cd setflow
```

### 2. Install Node dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 3. Create and activate a Python virtual environment

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
```

### 4. Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

### 5. (Optional) Override the database path

By default, Setflow looks for your Engine DJ library at:

```
C:\Users\<you>\Music\Engine Library\Database2\m.db
```

It also automatically scans drive letters D–Z for external drives.

To override manually, set the environment variable (semicolon-separated for multiple paths):

```bash
set ENGINE_DB_PATH=D:\Engine Library\Database2\m.db
```

---

## Running in Development

```bash
npm run dev
```

This starts the Vite dev server (port 5173), compiles the Electron main process, and launches the desktop window. The FastAPI backend is spawned automatically by Electron on port 8000.

To run the backend independently:

```bash
uvicorn backend.main:app --reload
```

Swagger UI: `http://localhost:8000/docs`

---

## Building

```bash
npm run build
```

Compiles the frontend (Vite), Electron main process (tsc), and packages the backend as a standalone executable (PyInstaller).

### Package as Windows installer

```bash
npm run package
```

Produces an NSIS installer in `release/`.

---

## API Endpoints

### `GET /tracks`

Returns tracks from your library, merged and deduplicated across all discovered databases.

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Search by title or artist |
| `genre` | string | Filter by genre |
| `min_bpm` | float | Minimum BPM |
| `max_bpm` | float | Maximum BPM |
| `limit` | int | Max results (default 100, max 2000) |
| `offset` | int | Pagination offset |

**Example:**
```
GET /tracks?search=disclosure&min_bpm=120&max_bpm=130
```

### `GET /tracks/count`

Returns the total number of tracks matching the same filter parameters as `/tracks`.

### `GET /tracks/{id}`

Returns a single track by its Engine DJ ID.

### `GET /tracks/{id}/audio`

Streams the audio file for a track. Supports HTTP range requests for scrubber support. Handles MP3, FLAC, WAV, AIFF, M4A, AAC, and OGG.

### `GET /health`

Health check — used by Electron to confirm the backend is ready before opening the window.

---

## Engine DJ Database Notes

- Setflow connects in **read-only mode** — your library is never modified.
- The database is located at `Music/Engine Library/Database2/m.db`.
- Musical key is stored as an integer and converted to **Camelot wheel notation** (e.g. `8A`, `5B`).
- Track duration is returned as both raw seconds and formatted `mm:ss`.
- Audio file paths are resolved by scanning your music directories recursively.

---

## License

MIT
