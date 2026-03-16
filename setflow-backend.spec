# setflow-backend.spec
# PyInstaller build spec for the Setflow FastAPI backend.
# Output: dist/backend/setflow-backend.exe
#
# Run with: pyinstaller setflow-backend.spec --noconfirm

import sys
from pathlib import Path

ROOT = Path(SPECPATH)

a = Analysis(
    # Entry point — wraps uvicorn startup
    [str(ROOT / 'backend' / 'bundle_entry.py')],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'anyio',
        'anyio._backends._asyncio',
        'starlette.routing',
        'fastapi',
        'pydantic',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name='setflow-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,           # no console window
    onefile=True,            # single .exe
)
