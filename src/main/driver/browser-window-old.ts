import { BrowserWindow, app } from 'electron'
import { Subject, Observable, BehaviorSubject } from 'rxjs'
import { filter, map, scan, tap } from 'rxjs/operators'
import { type Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

interface BrowserWindowEventSubject {
  event: string
  browserWindowId: number
  args?: any[]
}

type ExistedKeys<T> = ({ [P in keyof T]: T[P] extends never ? never : P })[keyof T]
type Existed<T> = Pick<T, ExistedKeys<T>>

type BrowserWindowFunctions = Existed<{
  [K in keyof BrowserWindow]: BrowserWindow[K] extends (...args: any) => any ? BrowserWindow[K] : never
}>

type Distribute<U extends keyof BrowserWindowFunctions> = U extends any ? {
  id: number
  method: U
  args: Parameters<BrowserWindowFunctions[U]>
} : never

export type BrowserWindowFunctionPayload = Distribute<keyof BrowserWindowFunctions>

export class BrowserWindowSource {
  private readonly events = new Set()
  private readonly event$ = new Subject<BrowserWindowEventSubject>()

  public select (e: string) {
    if (!this.events.has(e)) {
      this.events.add(e)
      const addEventListener = (win) => {
        const id = win.id
        win.on(e, (...args) => {
          this.event$.next({
            browserWindowId: id,
            event: e,
            args
          })
        })
      }
      BrowserWindow.getAllWindows().forEach((win) => { addEventListener(win) })
      app.on('browser-window-created', (ev, win) => { addEventListener(win) })
    }
    return adapt(this.event$.pipe(filter(({ event }: any) => event === e)) as any) as Observable<BrowserWindowEventSubject>
  }

  public allWindows () {
    interface AllWindowEvent {
      type: 'initial' | 'add' | 'remove'
      windows: BrowserWindow[]
    }
    const existed = BrowserWindow.getAllWindows()
    const subject = new BehaviorSubject<AllWindowEvent>({
      type: 'initial',
      windows: existed
    })

    const windows$ = subject.pipe(
      tap(({ type, windows }) => {
        if (type !== 'remove') {
          windows.forEach(win => {
            win.once('closed', () => {
              subject.next({
                type: 'remove',
                windows: [win]
              })
            })
          })
        }
      }),
      scan((acc, payload) => {
        switch (payload.type) {
          case 'initial':
            return new Set(payload.windows)
          case 'add':
            payload.windows.forEach(acc.add, acc)
            return acc
          case 'remove':
            payload.windows.forEach(acc.delete, acc)
            return acc
        }
      }, new Set<BrowserWindow>()),
      map(set => Array.from(set))
    )

    return windows$
  }
}

export function makeBrowserWindowDriver () {
  return (xs$: Stream<BrowserWindowFunctionPayload>) => {
    const manipulation$ = new Observable<BrowserWindowFunctionPayload>((subscriber) => {
      xs$.addListener({
        next: subscriber.next.bind(subscriber),
        complete: subscriber.complete.bind(subscriber),
        error: subscriber.error
      })
    })
    manipulation$.subscribe((payload) => {
      const browserWindow = BrowserWindow.fromId(payload.id)
      const { method, args } = payload;
      (browserWindow?.[method] as () => void)?.call(browserWindow, ...(args ?? []))
    })
    return new BrowserWindowSource()
  }
}