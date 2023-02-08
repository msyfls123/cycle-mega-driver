import path from 'path'

import {
  type ApplicationMenuSource,
  type BrowserWindowSource,
  type IpcMainSource,
  makeApplicationMenuDriver,
  makeBrowserWindowDriver,
  makeIpcMainDriver,
  makeAppLifecyleDriver,
  type AppLifecycleSource,
  createIpcScope,
  createBrowserWindowScope,
} from 'cycle-mega-driver/lib/main'
import { type MenuItemOptions } from 'cycle-mega-driver/lib/main/driver/application-menu'
import { intoEntries, type ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable'
import { type Observable, merge, of } from 'rxjs'
import { map, withLatestFrom } from 'rxjs/operators'

import isolate from '@cycle/isolate'
import { setup } from '@cycle/rxjs-run'
import debug from 'debug'

import { Menu } from './component/Menu'
import { type IPCMainConfig, type IPCRendererConfig, MenuId, TAB_MENU, Category } from './constants'
import { type BrowserWindowAction } from 'cycle-mega-driver/lib/constants/browser-window'
import type { AppLifecycleSink } from 'cycle-mega-driver/lib/main/driver/app-lifecycle'
import { Mainland } from './component/Mainland'

const main = (
  { browser, ipc, menu, lifecycle }:
  {
    browser: BrowserWindowSource
    ipc: IpcMainSource<IPCRendererConfig>
    menu: ApplicationMenuSource<MenuId>
    lifecycle: AppLifecycleSource
  }
): {
  browser: Observable<BrowserWindowAction>
  ipc: Observable<ChannelConfigToSink<IPCMainConfig>>
  menu: Observable<MenuItemOptions[]>
  lifecycle: Observable<AppLifecycleSink>
} => {
  // menu
  const browserIds$ = browser.allWindows().pipe(
    map((windows) => new Set(windows.map(w => w.id)))
  )
  const { menuTemplate: menu$ } = Menu({ ipc, browserIds$ })

  // browser window
  const create$ = of(
    {
      create: {
        ctorOptions: {
          webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
        },
        category: Category.Main
      },
    },
    {
      create: {
        ctorOptions: {
          webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
        },
      },
    },
  )

  const loadUrl$ = browser.newWindow().pipe(
    map(w => ({
      id: w.id,
      loadURL: `about:blank#${w.id.toString()}`,
    }))
  )

  const openDevTools$ = browser.newWindow().pipe(
    map(w => ({
      id: w.id,
      openDevTools: w.id === 1 ? { mode: 'right' } as const : { mode: 'bottom' } as const,
    }))
  )

  const focusByMenu = merge(
    ...TAB_MENU.map((id, index) => menu.select(id).pipe(map(() => index)))
  ).pipe(
    withLatestFrom(browserIds$),
    map(([index, browserIds]) => ({
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

  const IsolatedMainland = isolate(Mainland, {
    ipc: createIpcScope({ category: Category.Main }),
    browser: createBrowserWindowScope({ category: Category.Main }),
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
    ).pipe(lifecycle.whenReady),
    ipc: mainlandIpc$.pipe(lifecycle.whenReady),
    menu: menu$.pipe(lifecycle.whenReady),
    lifecycle: intoEntries({
      state: appState$,
      isQuittingEnabled: enableQuit$,
    }),
  }
}
const program = setup(
  main,
  {
    browser: makeBrowserWindowDriver(),
    ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
    menu: makeApplicationMenuDriver<MenuId>(),
    lifecycle: makeAppLifecyleDriver(),
  }
)
Object.entries(program.sinks).forEach(([key, sink]: [string, Observable<unknown>]) => {
  const log = debug(`Sink: ${key}`)
  sink.subscribe((data) => {
    log(data)
  })
})
program.run()
