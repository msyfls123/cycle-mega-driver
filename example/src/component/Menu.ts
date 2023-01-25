import { type IpcMainSource } from 'cycle-mega-driver/lib/main'
import { type MenuItemOptions } from 'cycle-mega-driver/lib/main/driver/application-menu'
import { type Observable, combineLatest, map, startWith } from 'rxjs'

import { type IPCMainConfig, type IPCRendererConfig, MenuId, TAB_MENU } from '../constants'

export function Menu (
  { ipc, browserIds$ }:
  {
    ipc: IpcMainSource<IPCMainConfig, IPCRendererConfig>
    browserIds$: Observable<Set<number>>
  }
): {
    menu: Observable<MenuItemOptions[]>
  } {
  return {
    menu: combineLatest([
      ipc.select('language').pipe(startWith({})),
      browserIds$.pipe(startWith(new Set<number>()))
    ]).pipe(
      map(([language, browserIds]) => {
        return [
          {
            label: 'App',
            submenu: [
              {
                label: 'Love',
                id: MenuId.Love,
                accelerator: 'CmdOrCtrl+L'
              }
            ]
          },
          {
            label: 'Windows',
            submenu: Array.from({ length: Math.min(9, browserIds.size) }).map((v, i) => ({
              label: `Browser ${Array.from(browserIds)[i]}`,
              id: TAB_MENU[i],
              accelerator: `CmdOrCtrl+${i + 1}`
            }))
          }
        ]
      })
    )
  }
}
