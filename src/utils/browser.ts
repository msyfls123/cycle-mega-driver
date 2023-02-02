import { BrowserWindow } from 'electron'

export function checkBrowserAvailable (item?: BrowserWindow) {
  return item instanceof BrowserWindow && !item.isDestroyed() && !item.webContents.isDestroyed()
}
