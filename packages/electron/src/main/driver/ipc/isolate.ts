import { BrowserWindow, type WebContents } from 'electron'
import { getCategory } from '../browser-window/utils'
import { type IpcScope } from '@src/constants/ipc'
import { type ChannelConfigToWebSink } from '@src/utils/observable'
import { isAutoScope } from '@src/utils/cyclejs'
import { Obj } from '@cycle-mega-driver/common/lib'

export function createIpcScope (scope: IpcScope): IpcScope {
  return scope
}

/**
 * isolate source
 */
export function matchIpcScope (webContents: WebContents, scope?: IpcScope) {
  if (isAutoScope(scope)) return true
  if (typeof scope === 'undefined') return true

  const { webContentsId, browserWindowId, category } = scope

  if (typeof webContentsId === 'number') {
    return webContents.id === webContentsId
  }

  const browserWindow = BrowserWindow.fromWebContents(webContents)

  if (typeof browserWindowId === 'number') {
    return browserWindow?.id === browserWindowId
  }

  if (typeof category === 'string' && browserWindow !== null) {
    return getCategory(browserWindow) === category
  }

  return true
}

/**
 * isolate sink
 */
export function attachIpcSinkScope <Output extends Obj> (
  sink: ChannelConfigToWebSink<Output>,
  scope?: IpcScope,
): ChannelConfigToWebSink<Output> {
  if (isAutoScope(scope)) return sink
  return {
    ...scope,
    ...sink,
  }
}

/**
 * match ipc sink affected webContents
 */
export function matchIpcSink <Output extends Obj> (
  webContents: WebContents,
  sink: ChannelConfigToWebSink<Output>,
) {
  const { webContentsId, browserWindowId, category } = sink

  if (typeof webContentsId === 'number') {
    return webContents.id === webContentsId
  }

  const browserWindow = BrowserWindow.fromWebContents(webContents)

  if (typeof browserWindowId === 'number') {
    return browserWindow?.id === browserWindowId
  }

  if (typeof category === 'string' && browserWindow !== null) {
    return getCategory(browserWindow) === category
  }

  return true
}
