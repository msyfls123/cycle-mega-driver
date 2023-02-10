import { checkBrowserAvailable } from 'cycle-mega-driver/lib/main'
import { ReplaySubject, connectable, filter, map, merge } from 'rxjs'
import { mapToIpcSink } from 'cycle-mega-driver/lib/utils/observable'
import { type MatchMain } from '../main/driver'

export const Mainland: MatchMain<'browser' | 'ipc'> = ({ browser, ipc }) => {
  // ipc
  const visible$ = connectable(merge(
    browser.select('blur').pipe(map(() => 'blur')),
    browser.select('focus').pipe(map(() => 'focus'))
  ), {
    connector: () => new ReplaySubject(1)
  })
  visible$.connect()

  const toggle$ = ipc.select('toggle-focus')
  const blurFromRenderer$ = toggle$.pipe(
    filter(({ browserWindow }) => checkBrowserAvailable(browserWindow)),
    map(({ data, browserWindow }) => ({
      id: browserWindow?.id,
      focus: data,
    })),
  )

  return {
    ipc: mapToIpcSink({
      visible: visible$
    }),
    browser: merge(
      blurFromRenderer$
    )
  }
}
