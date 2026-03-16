/**
 * electron/main.ts
 * Electron main process.
 * - Spawns the FastAPI backend (PyInstaller bundle in prod, uvicorn in dev)
 * - Creates the BrowserWindow with hardened security settings
 * - Shuts down the backend cleanly when the app closes
 */

import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'

// ─── Constants ───────────────────────────────────────────────────────────────

const IS_DEV       = !app.isPackaged
const BACKEND_PORT = 8000
const BACKEND_URL  = `http://127.0.0.1:${BACKEND_PORT}`
const FRONTEND_DEV = 'http://localhost:5173'
const MAX_WAIT_MS  = 15_000   // how long to wait for backend to be ready
const POLL_MS      = 250

// ─── Backend process ─────────────────────────────────────────────────────────

let backendProcess: ChildProcess | null = null

function getBackendExecutable(): { cmd: string; args: string[] } {
  if (IS_DEV) {
    // Dev: use the venv's Python to run uvicorn
    const venvPython = path.join(
      __dirname, '..', '..', '.venv', 'Scripts', 'python.exe'
    )
    return {
      cmd: venvPython,
      args: ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)]
    }
  }

  // Production: use the PyInstaller-bundled binary
  const exePath = path.join(
    process.resourcesPath, 'backend', 'setflow-backend.exe'
  )
  return { cmd: exePath, args: [] }
}

function startBackend(): void {
  const { cmd, args } = getBackendExecutable()

  const cwd = IS_DEV
    ? path.join(__dirname, '..', '..')  // repo root (so backend package resolves)
    : process.resourcesPath

  backendProcess = spawn(cmd, args, {
    cwd,
    stdio: IS_DEV ? 'inherit' : 'pipe',  // show backend logs in dev
    windowsHide: true,                    // no console window in prod
  })

  backendProcess.on('error', err => {
    console.error('[backend] Failed to start:', err.message)
  })

  backendProcess.on('exit', (code, signal) => {
    console.log(`[backend] Exited — code=${code} signal=${signal}`)
  })
}

function stopBackend(): void {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill()
    backendProcess = null
  }
}

// ─── Wait for backend to be ready ────────────────────────────────────────────

function waitForBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      http.get(`${BACKEND_URL}/health`, res => {
        if (res.statusCode === 200) return resolve()
        retry()
      }).on('error', retry)
    }

    const retry = () => {
      if (Date.now() - start > MAX_WAIT_MS) {
        return reject(new Error(`Backend did not start within ${MAX_WAIT_MS}ms`))
      }
      setTimeout(check, POLL_MS)
    }

    check()
  })
}

// ─── Window ──────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0b',
    title: 'Setflow',
    webPreferences: {
      // ── Security hardening ──────────────────────────────────────
      nodeIntegration: false,       // renderer cannot access Node APIs
      contextIsolation: true,       // preload runs in isolated context
      sandbox: true,                // renderer sandboxed like a browser
      preload: path.join(__dirname, 'preload.js'),
      // ────────────────────────────────────────────────────────────
      devTools: IS_DEV,
    },
  })

  // Prevent navigation to arbitrary URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(FRONTEND_DEV) && !url.startsWith('file://')) {
      event.preventDefault()
    }
  })

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (IS_DEV) {
    await mainWindow.loadURL(FRONTEND_DEV)
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(
      path.join(__dirname, '..', 'renderer', 'index.html')
    )
  }
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

// Expose backend URL to renderer via IPC (never via nodeIntegration)
ipcMain.handle('get-backend-url', () => BACKEND_URL)

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // ── Content Security Policy ───────────────────────────────────────────────
  // Dev needs 'unsafe-eval' for Vite HMR and the ws:// WebSocket connection.
  // Prod omits both — scripts are bundled, no eval required.
  const CSP = IS_DEV
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' http://127.0.0.1:8000 http://localhost:5173 ws://localhost:5173",
        "img-src 'self' data:",
      ].join('; ')
    : [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' http://127.0.0.1:8000",
        "img-src 'self' data:",
      ].join('; ')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP],
      },
    })
  })

  startBackend()

  try {
    await waitForBackend()
  } catch (e) {
    console.error('[electron] Backend startup timed out:', e)
    // Still open the window — it will show the API error state
  }

  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow()
  })
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopBackend()
})
