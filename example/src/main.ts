import path from 'path'

import {
  createIpcScope,
  createBrowserWindowScope,
  getCategory,
} from '@cycle-mega-driver/electron/lib/main'
import { type Observable, merge, of } from 'rxjs'
import { map, take, withLatestFrom } from 'rxjs/operators'

import isolate from '@cycle/isolate'
import { setup } from '@cycle/rxjs-run'
import debug from 'debug'

import { Menu } from './component/Menu'
import { MenuId, TAB_MENU, Category } from './constants'
import { Mainland } from './component/Mainland'
import { CATEGORY_RENDERER_MAP } from './main/constants'
import { MAIN_DRIVERS, type MainComponent } from './main/driver'

const main: MainComponent = ({ browser, ipc, menu, lifecycle }) => {
  // menu
  const browserIds$ = browser.allWindows().pipe(
    map((windows) => new Set(windows.map(w => w.id)))
  )
  const { menu: menu$ } = Menu({ ipc, browserIds$ })

  // browser window
  const create$ = of(
    browser.createSink({
      create: {
        ctorOptions: {
          webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
        },
        category: Category.Mainland
      },
    }),
    browser.createSink({
      create: {
        ctorOptions: {
          webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
        },
        category: Category.DBViewer
      },
    }),
  )

  const loadUrl$ = browser.newWindow().pipe(
    map(w => browser.createSink({
      id: w.id,
      loadURL: CATEGORY_RENDERER_MAP[getCategory(w)] ?? `about:blank#${getCategory(w)}`,
    }))
  )

  const openDevTools$ = browser.newWindow().pipe(
    map(w => browser.createSink({
      id: w.id,
      openDevTools: w.id === 1 ? { mode: 'right' } as const : { mode: 'bottom' } as const,
    }))
  )

  const focusByMenu = merge(
    ...TAB_MENU.map((id, index) => menu.select(id).pipe(map(() => index)))
  ).pipe(
    withLatestFrom(browserIds$),
    map(([index, browserIds]) => browser.createSink({
      id: Array.from(browserIds)[index],
      focus: true,
    }))
  )

  // lifecycle
  const appState$ = menu.select(MenuId.Quit).pipe(
    map(() => 'quit' as const)
  )
  const enableQuit$ = menu.select(MenuId.EnableQuit).pipe(
    map(({ menuItem }) => menuItem.checked)
  )

  const userData$ = lifecycle.paths.userData.pipe(
    take(1),
    map((origin) => {
      const newPath = path.join(origin, 'cycle-mega-driver')
      return { name: 'userData' as const, path: newPath }
    })
  )

  lifecycle.paths.userData.pipe(
    lifecycle.untilReady,
  ).subscribe(debug('userdata dir'))

  // components
  const IsolatedMainland = isolate(Mainland, {
    ipc: createIpcScope({ category: Category.Mainland }),
    browser: createBrowserWindowScope({ category: Category.Mainland }),
  })

  const {
    browser: mainlandBrowser$,
    ipc: mainlandIpc$,
  } = IsolatedMainland({ browser, ipc })

  return {
    browser: merge(
      mainlandBrowser$,
      focusByMenu,
      create$,
      loadUrl$,
      openDevTools$,
    ),
    ipc: mainlandIpc$,
    menu: menu$,
    lifecycle: lifecycle.createSink({
      state: appState$,
      isQuittingEnabled: enableQuit$,
      setPath: userData$,
    }),
  }
}
const program = setup(
  main,
  MAIN_DRIVERS
)
Object.entries(program.sinks).forEach(([key, sink]: [string, Observable<unknown>]) => {
  const log = debug(`Sink: ${key}`)
  sink.subscribe((data) => {
    log(data)
  })
})
program.run()
