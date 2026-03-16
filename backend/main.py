"""
main.py
Setflow API entry point.
Run with: uvicorn backend.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import tracks, audio, waveform, playlists

app = FastAPI(
    title="Setflow API",
    description="Engine DJ library browser and DJ set planner API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*", "range"],
    expose_headers=["content-range", "accept-ranges", "content-length"],
)

app.include_router(tracks.router)
app.include_router(audio.router)
app.include_router(waveform.router)
app.include_router(playlists.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "setflow"}
