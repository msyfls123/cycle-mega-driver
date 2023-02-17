import type { BrowserWindow } from 'electron'

import type { BrowserWindowAction, BrowserWindowScope } from '@src/constants/browser-window'
import { isAutoScope } from '@src/utils/cyclejs'

import { getCategory } from './utils'

export function createBrowserWindowScope (scope: BrowserWindowScope): BrowserWindowScope {
  return scope
}

/**
 * isolate source
 */
export function matchBrowserWindowScope (
  browserWindow: BrowserWindow,
  scope?: BrowserWindowScope,
): boolean {
  if (isAutoScope(scope)) return true

  const { id, category } = scope ?? {}
  if (typeof id === 'number') {
    return browserWindow.id === id
  }
  if (typeof category === 'string') {
    return getCategory(browserWindow) === category
  }
  return true
}

/**
 * isolate sink
 */
export function attachBrowserWindowActionScope (
  action: BrowserWindowAction,
  scope?: BrowserWindowScope,
): BrowserWindowAction {
  if (isAutoScope(scope)) return action

  return {
    ...scope,
    ...action,
  }
}

/**
 * match action affected browser windows
 */
export function matchBrowserWindowAction (
  browserWindow: BrowserWindow,
  action: BrowserWindowAction,
): boolean {
  const { id, category } = action
  if (typeof id === 'number') {
    return browserWindow.id === id
  }
  if (typeof category === 'string') {
    return getCategory(browserWindow) === category
  }
  return true
}
