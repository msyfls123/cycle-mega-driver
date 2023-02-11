import { type MenuItemOptions } from 'cycle-mega-driver/lib/main/driver/application-menu'
import { type Observable, combineLatest, map, startWith } from 'rxjs'

import { MenuId, TAB_MENU } from '../constants'
import { type MatchMain } from '../main/driver'

export const Menu: MatchMain<{
  SourceKeys: 'ipc'
  SinkKeys: 'menu'
  ExtraSources: { browserIds$: Observable<Set<number>> }
  ExtraSinks: unknown
}> = (
  { ipc, browserIds$ }
) => {
  return {
    menu: combineLatest([
      ipc.select('language').pipe(startWith({})),
      browserIds$.pipe(startWith(new Set<number>()))
    ]).pipe(
      map(([language, browserIds]) => {
        const template: MenuItemOptions[] = [
          {
            label: 'App',
            submenu: [
              {
                label: 'Love',
                id: MenuId.Love,
                accelerator: 'CmdOrCtrl+L'
              },
              {
                label: 'Quit',
                id: MenuId.Quit,
                accelerator: 'CmdOrCtrl+Q'
              },
              {
                label: 'Enable Quit',
                id: MenuId.EnableQuit,
                type: 'checkbox',
                checked: true,
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
        return template
      })
    )
  }
}
