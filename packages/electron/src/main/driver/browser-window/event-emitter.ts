import { type BrowserWindowEventEmitters, type BrowserWindowEventCallback } from 'cycle-mega-driver/src/constants/browser-window'
import { type BrowserWindow } from 'electron'

const emitters: BrowserWindowEventEmitters = {
  focus: (browserWindow, next) => {
    browserWindow.on('focus', next)
  },
  blur: (browserWindow, next) => {
    browserWindow.on('blur', next)
  },
}

export function listenToBrowserWindowEvents (browserWindow: BrowserWindow, next: BrowserWindowEventCallback) {
  for (const [key, emitter] of Object.entries(emitters)) {
    emitter(browserWindow, (data) => {
      next({
        type: key,
        data,
      } as any)
    })
  }
}
