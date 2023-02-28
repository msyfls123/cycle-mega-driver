import { ReplaySubject, connectable, map, merge } from 'rxjs'
import { type MatchMain } from '../main/driver'

export const Mainland: MatchMain<{
  SourceKeys: 'browser' | 'ipc'
}> = ({ browser, ipc }) => {
  // ipc
  const visible$ = connectable(merge(
    browser.select('blur').pipe(map(() => 'blur')),
    browser.select('focus').pipe(map(() => 'focus'))
  ).pipe(map(text => ipc.createSink({
    visible: text
  }))), {
    connector: () => new ReplaySubject(1)
  })
  visible$.connect()

  const toggle$ = ipc.select('toggle-focus')
  const blurFromRenderer$ = toggle$.pipe(
    // filter(({ browserWindow }) => checkBrowserAvailable(browserWindow)),
    map(({ data, browserWindow }) => browser.createSink({
      id: browserWindow?.id,
      focus: data,
    })),
  )

  return {
    ipc: visible$,
    browser: merge(
      blurFromRenderer$
    )
  }
}
