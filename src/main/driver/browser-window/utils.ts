import type { BrowserWindow } from 'electron'

export function getCategory (browserWindow: BrowserWindow) {
  return browserWindow.accessibleTitle
}

export function setCategory (browserWindow: BrowserWindow, category: string) {
  browserWindow.accessibleTitle = category
}
