/**
 * electron/preload.ts
 * Runs in an isolated context — bridges main process to renderer
 * without exposing Node.js APIs directly.
 *
 * Only expose what the renderer genuinely needs.
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Returns the backend base URL.
   * Renderer uses this instead of hardcoding localhost:8000.
   */
  getBackendUrl: (): Promise<string> =>
    ipcRenderer.invoke('get-backend-url'),
})
