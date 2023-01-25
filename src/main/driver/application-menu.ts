import { xsToObservable } from 'cycle-mega-driver/src/utils/observable';
import { BrowserWindow, KeyboardEvent, Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { Observable, Subject, filter } from 'rxjs';
import { Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt';

export type MenuItemOptions = Omit<MenuItemConstructorOptions, 'click' | 'submenu'> & {
    submenu?: MenuItemOptions[]
}

function buildTemplateWithClickCallback(
    template: MenuItemOptions[],
    clickCallback: MenuItemConstructorOptions['click']
): MenuItemConstructorOptions[] {
    return template.map((options) => ({
        ...options,
        click: options.role
            ? undefined
            : (menuItem, browserWindow, event) => {
                clickCallback(menuItem, browserWindow, event)
            },
        submenu: options.submenu && buildTemplateWithClickCallback(options.submenu, clickCallback)
    }))
}

interface MenuItemClickEvent {
    menuItem: MenuItem
    browserWindow: BrowserWindow
    event: KeyboardEvent
}

export class ApplicationMenuSource<T extends string> {
    private menuItemClick$: Subject<MenuItemClickEvent> = new Subject()
    constructor(sink$: Observable<MenuItemOptions[]>) {
        sink$.subscribe({
            next: this.handleUpdateMenu,
            error: console.error,
        })
    }

    public select(id: T) {
        return adapt(this.menuItemClick$.pipe(
            filter(({ menuItem }) => menuItem.id === id)
        ) as any) as Observable<MenuItemClickEvent>
    }

    private handleUpdateMenu = (template: MenuItemOptions[]) => {
        const prevMenu = Menu.getApplicationMenu() as any
        const clickCallback = (
            menuItem: MenuItem,
            browserWindow: BrowserWindow,
            event: KeyboardEvent,
        ) => this.menuItemClick$.next({ menuItem, browserWindow, event })
        const boundTemplate: MenuItemConstructorOptions[] = buildTemplateWithClickCallback(template, clickCallback)
        const newMenu = Menu.buildFromTemplate(boundTemplate)
        Menu.setApplicationMenu(newMenu)
        prevMenu?.clear()
    }
}

export function makeApplicationMenuDriver<T extends string>() {
    return (xs$: Stream<MenuItemOptions[]>) => {
        const sink$ = xsToObservable(xs$)
        return new ApplicationMenuSource<T>(sink$)
    }
}
