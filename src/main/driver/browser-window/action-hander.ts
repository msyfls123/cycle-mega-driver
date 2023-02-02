import { BrowserWindow } from 'electron'
import { type BrowserWindowActionHandler, type BrowserWindowAction } from '../../../constants/browser-window'
import { checkBrowserAvailable } from 'cycle-mega-driver/src/utils/browser'

const handlers: BrowserWindowActionHandler = {
  focus: ({ payload, browserWindow }) => {
    if (payload) {
      browserWindow.focus()
    } else {
      browserWindow.blur()
    }
  }
}

export function actionHander (action: BrowserWindowAction) {
  if (typeof action.id === 'undefined') {
    console.error('You should pass `id` to invoke BrowserWindow action.\nRaw Action:\n', action)
    return
  }
  const browserWindow = BrowserWindow.fromId(action.id)
  if (!(browserWindow !== null && checkBrowserAvailable(browserWindow))) return
  Object.entries(action).forEach(([key, payload]) => {
    handlers[key]?.({
      browserWindow,
      payload,
    })
  })
}
