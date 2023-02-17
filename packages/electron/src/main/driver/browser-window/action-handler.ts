import { BrowserWindow } from 'electron'
import { type BrowserWindowActionHandler, type BrowserWindowAction } from '../../../constants/browser-window'
import { checkBrowserAvailable, setCategory } from './utils'
import { matchBrowserWindowScope } from './isolate'

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
  setCategory(win, category)
}

export function actionHandler (action: BrowserWindowAction) {
  if (action.create !== undefined) {
    createHandler(action.create)
    return
  }

  // if (['id', 'category'].every(key => typeof action[key] === 'undefined')) {
  //   console.error("You should pass either 'id' or 'category' to invoke BrowserWindow action.\nRaw Action:\n", action)
  //   return
  // }

  const browserWindows = BrowserWindow.getAllWindows()
    .filter(browserWindow => (
      browserWindow !== null &&
      checkBrowserAvailable(browserWindow) &&
      matchBrowserWindowScope(browserWindow, action)
    ))

  for (const browserWindow of browserWindows) {
    Object.entries(action).forEach(
      <T extends keyof BrowserWindowActionHandler>
      ([key, payload]: [T, BrowserWindowAction[T]]) => {
        handlers[key]?.({
          browserWindow,
          payload: payload as Required<BrowserWindowAction>[T],
        })
      })
  }
}
