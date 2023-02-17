import { xsToObservable } from '@src/utils/observable'
import { type BrowserWindow, type KeyboardEvent, Menu, type MenuItem, type MenuItemConstructorOptions } from 'electron'
import { type Observable, Subject, filter } from 'rxjs'
import { type Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

export type MenuItemOptions = Omit<MenuItemConstructorOptions, 'click' | 'submenu'> & {
  submenu?: MenuItemOptions[]
}

function buildTemplateWithClickCallback (
  template: MenuItemOptions[],
  clickCallback: Required<MenuItemConstructorOptions>['click']
): MenuItemConstructorOptions[] {
  return template.map((options) => ({
    ...options,
    click: typeof options.role === 'undefined'
      ? (menuItem, browserWindow, event) => {
          clickCallback(menuItem, browserWindow, event)
        }
      : undefined,
    submenu: typeof options.submenu !== 'undefined'
      ? buildTemplateWithClickCallback(options.submenu, clickCallback)
      : undefined
  }))
}

interface MenuItemClickEvent {
  menuItem: MenuItem
  browserWindow: BrowserWindow
  event: KeyboardEvent
}

export class ApplicationMenuSource<T extends string> {
  private readonly menuItemClick$ = new Subject<MenuItemClickEvent>()
  constructor (sink$: Observable<MenuItemOptions[]>) {
    sink$.subscribe({
      next: this.handleUpdateMenu,
      error: console.error
    })
  }

  public select (id: T) {
    return adapt(this.menuItemClick$.pipe(
      filter(({ menuItem }) => menuItem.id === id)
    ) as any) as Observable<MenuItemClickEvent>
  }

  private readonly handleUpdateMenu = (template: MenuItemOptions[]) => {
    const prevMenu = Menu.getApplicationMenu() as any
    const clickCallback = (
      menuItem: MenuItem,
      browserWindow: BrowserWindow,
      event: KeyboardEvent
    ) => { this.menuItemClick$.next({ menuItem, browserWindow, event }) }
    const boundTemplate: MenuItemConstructorOptions[] = buildTemplateWithClickCallback(template, clickCallback)
    const newMenu = Menu.buildFromTemplate(boundTemplate)
    Menu.setApplicationMenu(newMenu)
    prevMenu?.clear()
  }
}

export function makeApplicationMenuDriver<T extends string> () {
  return (xs$: Stream<MenuItemOptions[]>) => {
    const sink$ = xsToObservable(xs$)
    return new ApplicationMenuSource<T>(sink$)
  }
}
