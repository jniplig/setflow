"""
backend/bundle_entry.py
Entry point used by PyInstaller to launch the Setflow backend.
NOT used in normal development — only when building the packaged exe.
"""

import uvicorn

if __name__ == '__main__':
    uvicorn.run(
        'backend.main:app',
        host='127.0.0.1',
        port=8000,
        log_level='warning',   # quieter in production
    )
