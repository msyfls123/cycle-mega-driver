import path from 'path'

import {
  type ApplicationMenuSource,
  type BrowserWindowSource,
  type IpcMainSource,
  makeApplicationMenuDriver,
  makeBrowserWindowDriver,
  makeIpcMainDriver,
  mapToIpcSink,
  makeAppLifecyleDriver,
  type AppLifecycleSource,
} from 'cycle-mega-driver/lib/main'
import { type MenuItemOptions } from 'cycle-mega-driver/lib/main/driver/application-menu'
import { intoEntries, type ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable'
import { type Observable, ReplaySubject, connectable, merge, of } from 'rxjs'
import { filter, map, repeat, startWith, withLatestFrom } from 'rxjs/operators'

import isolate from '@cycle/isolate'
import { setup } from '@cycle/rxjs-run'
import debug from 'debug'

import { Menu } from './component/Menu'
import { type IPCMainConfig, type IPCRendererConfig, MenuId, TAB_MENU } from './constants'
import { type BrowserWindowAction } from 'cycle-mega-driver/lib/constants/browser-window'
import type { AppLifecycleSink } from 'cycle-mega-driver/lib/main/driver/app-lifecycle'

const main = (
  { browser, ipc, menu, lifecycle }:
  {
    browser: BrowserWindowSource
    ipc: IpcMainSource<IPCMainConfig, IPCRendererConfig>
    menu: ApplicationMenuSource<MenuId>
    lifecycle: AppLifecycleSource
  }
): {
  browser: Observable<BrowserWindowAction>
  ipc: Observable<ChannelConfigToSink<IPCMainConfig>>
  menu: Observable<MenuItemOptions[]>
  lifecycle: Observable<AppLifecycleSink>
} => {
  // ipc
  const visible$ = connectable(merge(
    browser.select('blur').pipe(map(() => 'blur'), startWith('blur')),
    browser.select('focus').pipe(map(() => 'focus'))
  ), {
    connector: () => new ReplaySubject(1)
  })
  visible$.connect()

  // menu
  const browserIds$ = browser.allWindows().pipe(
    map((windows) => new Set(windows.map(w => w.id)))
  )
  const { menuTemplate: menu$ } = Menu({ ipc, browserIds$ })

  // browser window
  const create$ = of({
    create: {
      ctorOptions: {
        webPreferences: {
          preload: path.join(__dirname, 'preload.js')
        }
      },
    },
  }).pipe(repeat(2))

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

  const toggle$ = ipc.select('toggle-focus')
  const blurFromRenderer$ = toggle$.pipe(
    map(({ browserWindow }) => browserWindow),
    filter(Boolean),
    map(() => ({
      focus: false,
    })),
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

  return {
    browser: merge(
      blurFromRenderer$,
      focusByMenu,
      create$,
      loadUrl$,
      openDevTools$,
    ).pipe(lifecycle.whenReady),
    ipc: mapToIpcSink({
      visible: visible$
    }).pipe(lifecycle.whenReady),
    menu: menu$,
    lifecycle: intoEntries({
      state: appState$,
      isQuittingEnabled: enableQuit$,
    }),
  }
}
const program = setup(
  isolate(main, {
    // TODO use category
    ipc: 1,
    browser: 1,
  }),
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
