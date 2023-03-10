import { BrowserWindow, type WebContents } from 'electron'

export function checkBrowserAvailable (item?: BrowserWindow) {
  return item instanceof BrowserWindow && !item.isDestroyed() && !item.webContents.isDestroyed()
}

export function getCategory (browserWindow: BrowserWindow) {
  return browserWindow.accessibleTitle
}

export function getCategoryFromWebContents (webContents: WebContents) {
  const browserWindow = BrowserWindow.fromWebContents(webContents)
  return browserWindow === null ? null : getCategory(browserWindow)
}

export function setCategory (browserWindow: BrowserWindow, category?: string) {
  if (typeof category === 'string') {
    browserWindow.accessibleTitle = category
  }
}
