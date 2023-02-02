import { type BrowserWindow } from 'electron'

export interface BrowserWindowAction {
  id?: number
  focus?: boolean
}

export type BrowserWindowActionHandler = {
  [K in Exclude<keyof BrowserWindowAction, 'id'>]: (options: {
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

export type BrowserWindowEventCallback = (payload: Pick<BrowserWindowEvent, 'type' | 'data'>) => void

export type BrowserWindowEventEmitters = {
  [K in keyof AllBrowserWindowEvents]: (
    browserWindow: BrowserWindow,
    cb: (data: AllBrowserWindowEvents[K]) => void,
  ) => void
}
