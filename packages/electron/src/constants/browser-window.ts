import { type BrowserWindowConstructorOptions, type BrowserWindow, type OpenDevToolsOptions } from 'electron'

export interface BrowserWindowScope {
  category?: string
  id?: number
}

export interface BrowserWindowAction extends BrowserWindowScope {
  focus?: boolean
  create?: { ctorOptions: BrowserWindowConstructorOptions, category?: string }
  show?: null
  loadURL?: string
  openDevTools?: OpenDevToolsOptions | null
}

export type BrowserWindowActionHandler = {
  [K in Exclude<keyof BrowserWindowAction, keyof BrowserWindowScope>]: (options: {
    payload: Required<BrowserWindowAction>[K]
    browserWindow: BrowserWindow
  }) => void
}

interface AllBrowserWindowEvents {
  focus: null
  blur: null
}

export type BrowserWindowEvent = {
  [K in keyof AllBrowserWindowEvents]: {
    type: K
    browserWindow: BrowserWindow
    data: AllBrowserWindowEvents[K]
  }
}[keyof AllBrowserWindowEvents]

export type BrowserWindowEventCallback = {
  [K in keyof AllBrowserWindowEvents]: (payload: {
    type: K
    data: AllBrowserWindowEvents[K]
  }) => void
}[keyof AllBrowserWindowEvents]

export type BrowserWindowEventEmitters = {
  [K in keyof AllBrowserWindowEvents]: (
    browserWindow: BrowserWindow,
    cb: (data: AllBrowserWindowEvents[K]) => void,
  ) => void
}
