import { BrowserWindow, app } from 'electron'
import { Subject, Observable } from 'rxjs'
import { filter } from 'rxjs/operators'
import { Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

interface BrowserWindowEventSubject {
    event: string
    browserWindowId: number
    args?: any[]
}

type ExistedKeys<T> = ({ [P in keyof T]: T[P] extends never ? never : P })[keyof T];
type Existed<T> = Pick<T, ExistedKeys<T>>;

type BrowserWindowFunctions = Existed<{
    [K in keyof BrowserWindow]: BrowserWindow[K] extends Function ? BrowserWindow[K] : never
  }>;

interface BrowserWindowFunctionPayload<T extends keyof BrowserWindowFunctions = any> {
    id: number
    method: T
    args: Parameters<BrowserWindowFunctions[T]>
}

export class BrowserWindowSource {
    private events = new Set
    private event$ = new Subject<BrowserWindowEventSubject>
    public select(e: string) {
        if (!this.events.has(e)) {
            this.events.add(e)
            const addEventListener = (win) => {
                win.on(e, (...args) => {
                    this.event$.next({
                        browserWindowId: win.id,
                        event: e,
                        args,
                    })
                })
            }
            BrowserWindow.getAllWindows().forEach((win) => addEventListener(win))
            app.on('browser-window-created', (ev, win) => addEventListener(win))
        }
        return adapt(this.event$.pipe(filter(({ event }: any) => event === e )) as any) as Observable<BrowserWindowEventSubject>
    }
}

export function makeBrowserWindowDriver() {
    return (xs$: Stream<BrowserWindowFunctionPayload>) => {
        const manipulation$ = new Observable<BrowserWindowFunctionPayload>((subscriber) => {
            (xs$ as any).addListener({
              next: subscriber.next.bind(subscriber),
              complete: subscriber.complete.bind(subscriber),
              error: subscriber.error
            })
        })
        manipulation$.subscribe((payload) => {
            const browserWindow = BrowserWindow.fromId(payload.id)
            browserWindow[payload.method](...(payload.args ?? []))
        })
        return new BrowserWindowSource
    }
}
