import path from 'path'

import {
  type ApplicationMenuSource,
  type BrowserWindowSource,
  type IpcMainSource,
  makeApplicationMenuDriver,
  makeBrowserWindowDriver,
  makeIpcMainDriver,
  mergeWithKey
} from 'cycle-mega-driver/lib/main'
import { type MenuItemOptions } from 'cycle-mega-driver/lib/main/driver/application-menu'
import type { BrowserWindowFunctionPayload } from 'cycle-mega-driver/lib/main/driver/browser-window'
import { type ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable'
import { BrowserWindow, app } from 'electron'
import { type Observable, ReplaySubject, connectable, merge } from 'rxjs'
import { filter, map, scan, startWith, withLatestFrom } from 'rxjs/operators'

import isolate from '@cycle/isolate'
import { run } from '@cycle/rxjs-run'

import { Menu } from './component/Menu'
import { type IPCMainConfig, type IPCRendererConfig, type MenuId, TAB_MENU } from './constants'

app.whenReady().then(() => {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.loadURL('about:blank').catch(() => {})
  win.webContents.openDevTools({ mode: 'right' })

  const win2 = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win2.loadURL('about:blank#123').catch(() => {})
  win2.webContents.openDevTools({ mode: 'bottom' })

  const main = (
    { browser, ipc, menu }:
    {
      browser: BrowserWindowSource
      ipc: IpcMainSource<IPCMainConfig, IPCRendererConfig>
      menu: ApplicationMenuSource<MenuId>
    }
  ): {
    browser: Observable<BrowserWindowFunctionPayload>
    ipc: Observable<ChannelConfigToSink<IPCMainConfig>>
    menu: Observable<MenuItemOptions[]>
  } => {
    const output = merge(
      browser.select('blur').pipe(map(() => 'blur'), startWith('blur')),
      browser.select('focus').pipe(map(() => 'focus'))
    )
    const visible$ = connectable(output, {
      connector: () => new ReplaySubject(1)
    })
    visible$.connect()

    const browserIds$ = merge(
      browser.select('show'),
      browser.select('closed')
    ).pipe(
      scan((acc, { browserWindowId, event }) => {
        if (event === 'show') {
          acc.add(browserWindowId)
        }
        if (event === 'closed') {
          acc.delete(browserWindowId)
        }
        return acc
      }, new Set<number>()),
      startWith(new Set<number>())
    )
    const { menu: menu$ } = Menu({ ipc, browserIds$ })

    const toggle$ = ipc.select('toggle-focus')
    const browserSink$ = toggle$.pipe(
      map(({ browserWindow }) => browserWindow),
      filter(Boolean),
      map((browserWindow) => ({
        id: browserWindow.id,
        method: 'blur' as const,
        args: [] as []
      })),
    )

    const browserSink2$ = merge(
      ...TAB_MENU.map((id, index) => menu.select(id).pipe(map(() => index)))
    ).pipe(
      withLatestFrom(browserIds$),
      map(([index, browserIds]) => ({
        id: Array.from(browserIds)[index],
        method: 'focus' as const,
        args: [] as []
      }))
    )

    return {
      browser: merge(browserSink$, browserSink2$),
      ipc: mergeWithKey({
        visible: visible$
      }),
      menu: menu$
    }
  }
  run(
    isolate(main, {
      ipc: win.webContents.id
    }),
    {
      browser: makeBrowserWindowDriver(),
      ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
      menu: makeApplicationMenuDriver<MenuId>()
    }
  )
}).catch(console.error)
