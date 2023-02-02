import { filter, type Observable, startWith, pairwise, Subject, map } from 'rxjs'

import { type BrowserWindowAction, type BrowserWindowEvent } from '../../../constants/browser-window'
import { adapt } from '@cycle/run/lib/adapt'
import { type Stream } from 'xstream'
import { xsToObservable } from 'cycle-mega-driver/src/utils/observable'
import { actionHander } from './action-hander'
import { getAllWindows } from './all-windows'
import { listenToBrowserWindowEvents } from './event-emitter'
import { type BrowserWindow } from 'electron'

interface BrowserWindowSourceShared {
  rawEvent$: Observable<BrowserWindowEvent>
  allWindows$: Observable<BrowserWindow[]>
}

export class BrowserWindowSource {
  private readonly event$: Observable<BrowserWindowEvent>

  public constructor (
    private readonly shared: BrowserWindowSourceShared,
    scope?: number,
  ) {
    if (typeof scope !== 'undefined') {
      this.event$ = shared.rawEvent$.pipe(
        filter(({ browserWindow }) => browserWindow.id === scope)
      )
    } else {
      this.event$ = shared.rawEvent$
    }
  }

  public isolateSource = (source: BrowserWindowSource, scope: any) => {
    return new BrowserWindowSource(
      source.getShared(),
      scope
    )
  }

  public isolateSink = (sink$: Stream<BrowserWindowAction>, scope: any) => {
    return adapt(xsToObservable(sink$).pipe(map((payload) => ({
      ...payload,
      id: payload.id ?? scope
    }))) as any)
  }

  public select<K extends BrowserWindowEvent['type']>(name: K) {
    return adapt(this.event$.pipe(
      filter(({ type }) => type === name)
    ) as any) as Observable<BrowserWindowEvent>
  }

  public allWindows () {
    return adapt(this.shared.allWindows$ as any) as Observable<BrowserWindow[]>
  }

  private getShared () {
    return this.shared
  }
}

function createSource () {
  const subject = new Subject<BrowserWindowEvent>()
  const allWindows$ = getAllWindows()
  allWindows$.pipe(
    startWith(<BrowserWindow[]>[]),
    pairwise(),
  ).subscribe(([prev, current]) => {
    const diff = current.filter(x => !prev.some(y => y === x))
    diff.forEach(browserWindow => {
      listenToBrowserWindowEvents(
        browserWindow,
        ({ type, data }) => {
          subject.next({
            type,
            data,
            browserWindow,
          })
        }
      )
    })
  })
  return new BrowserWindowSource({
    rawEvent$: subject.asObservable(),
    allWindows$,
  })
}

export function makeBrowserWindowDriver () {
  return (xs$: Stream<BrowserWindowAction>) => {
    const action$ = xsToObservable(xs$)
    action$.subscribe(actionHander)
    return createSource()
  }
}
