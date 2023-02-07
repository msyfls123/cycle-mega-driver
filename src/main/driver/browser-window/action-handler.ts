import { BrowserWindow } from 'electron'
import { type BrowserWindowActionHandler, type BrowserWindowAction } from '../../../constants/browser-window'
import { checkBrowserAvailable } from 'cycle-mega-driver/src/utils/browser'
import { setCategory } from './utils'

const handlers: BrowserWindowActionHandler = {
  create: () => {},
  focus: ({ payload, browserWindow }) => {
    if (payload) {
      browserWindow.focus()
    } else {
      browserWindow.blur()
    }
  },
  show: ({ browserWindow }) => {
    browserWindow.show()
  },
  loadURL ({ payload, browserWindow }) {
    browserWindow.loadURL(payload).catch(() => {})
  },
  openDevTools ({ payload, browserWindow }) {
    browserWindow.webContents.openDevTools(payload ?? undefined)
  }
}

const createHandler = (payload: Required<BrowserWindowAction>['create']) => {
  const { ctorOptions, category } = payload
  const win = new BrowserWindow(ctorOptions)
  if (typeof category !== 'undefined') {
    setCategory(win, category)
  }
}

export function actionHandler (action: BrowserWindowAction) {
  if (action.create !== undefined) {
    createHandler(action.create)
    return
  }

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
