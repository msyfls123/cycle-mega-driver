import { filter, type Observable, startWith, pairwise, Subject, map, delayWhen, from } from 'rxjs'

import {
  type BrowserWindowScope,
  type BrowserWindowAction,
  type BrowserWindowEvent,
  type BrowserWindowEventCallback,
} from '@src/constants/browser-window'
import { adapt } from '@cycle/run/lib/adapt'
import { type Stream } from 'xstream'
import { xsToObservable } from '@cycle-mega-driver/common/lib'
import { actionHandler } from './action-handler'
import { getAllWindows } from './all-windows'
import { listenToBrowserWindowEvents } from './event-emitter'
import { app, type BrowserWindow } from 'electron'
import { matchBrowserWindowScope, attachBrowserWindowActionScope } from './isolate'

export { createBrowserWindowScope } from './isolate'
export * from './utils'

interface BrowserWindowSourceShared {
  rawEvent$: Observable<BrowserWindowEvent>
  allWindows$: Observable<BrowserWindow[]>
  newWindow$: Observable<BrowserWindow>
}

export class BrowserWindowSource {
  select: <K extends BrowserWindowEvent['type']>(name: K) => Observable<BrowserWindowEvent>
  allWindows: () => Observable<BrowserWindow[]>
  newWindow: () => Observable<BrowserWindow>
  createSink: (action: BrowserWindowAction) => BrowserWindowAction
}

class BrowserWindowSourceImpl implements BrowserWindowSource {
  private readonly event$: Observable<BrowserWindowEvent>

  public constructor (
    private readonly shared: BrowserWindowSourceShared,
    private readonly scope?: BrowserWindowScope,
  ) {
    if (typeof scope !== 'undefined') {
      this.event$ = shared.rawEvent$.pipe(
        filter(({ browserWindow }) => matchBrowserWindowScope(browserWindow, scope))
      )
    } else {
      this.event$ = shared.rawEvent$
    }

    Reflect.defineProperty(this, 'isolateSink', {
      value: (sink$: Stream<BrowserWindowAction>, scope: BrowserWindowScope) => {
        return adapt(xsToObservable(sink$).pipe(
          map((action) => attachBrowserWindowActionScope(action, scope))
        ) as any) as Stream<BrowserWindowAction>
      }
    })
  }

  public isolateSource = (source: BrowserWindowSourceImpl, scope: BrowserWindowScope) => {
    return new BrowserWindowSourceImpl(
      source.getShared(),
      scope
    )
  }

  public select<K extends BrowserWindowEvent['type']>(name: K) {
    return adapt(this.event$.pipe(
      filter(({ type }) => type === name)
    ) as any) as Observable<BrowserWindowEvent>
  }

  public allWindows () {
    return adapt(
      this.shared.allWindows$.pipe(
        map((browserWindows) => browserWindows.filter(w => matchBrowserWindowScope(w, this.scope)))
      ) as any) as Observable<BrowserWindow[]>
  }

  public newWindow () {
    return adapt(
      this.shared.newWindow$.pipe(
        filter(w => matchBrowserWindowScope(w, this.scope))
      ) as any) as Observable<BrowserWindow>
  }

  public createSink (action: BrowserWindowAction) {
    return action
  }

  private getShared () {
    return this.shared
  }
}

function createSource () {
  const subject = new Subject<BrowserWindowEvent>()
  const { allWindows$, newWindow$ } = getAllWindows()
  allWindows$.pipe(
    startWith(<BrowserWindow[]>[]),
    pairwise(),
  ).subscribe(([prev, current]) => {
    const diff = current.filter(x => !prev.some(y => y === x))
    diff.forEach(browserWindow => {
      listenToBrowserWindowEvents(
        browserWindow,
        ({ type, data }: Parameters<BrowserWindowEventCallback>[0]) => {
          subject.next({
            type,
            data,
            browserWindow,
          })
        }
      )
    })
  })
  return new BrowserWindowSourceImpl({
    rawEvent$: subject.asObservable(),
    allWindows$,
    newWindow$,
  })
}

export function makeBrowserWindowDriver () {
  return (xs$: Stream<BrowserWindowAction>): BrowserWindowSource => {
    const action$ = xsToObservable(xs$).pipe(
      delayWhen(() => from(app.whenReady()))
    )
    action$.subscribe(actionHandler)
    return createSource()
  }
}
