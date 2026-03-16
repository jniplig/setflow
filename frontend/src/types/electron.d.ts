/**
 * electron.d.ts
 * Extends the Window interface with the API exposed by the Electron preload script.
 * This gives TypeScript awareness of window.electronAPI in the React frontend.
 */

interface Window {
  electronAPI?: {
    getBackendUrl: () => Promise<string>
  }
}
