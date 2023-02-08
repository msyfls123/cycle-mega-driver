import { type BrowserWindowAction } from 'cycle-mega-driver/lib/constants/browser-window'
import { type BrowserWindowSource, type IpcMainSource, checkBrowserAvailable, mapToIpcSink } from 'cycle-mega-driver/lib/main'
import { type Observable, ReplaySubject, connectable, filter, map, merge } from 'rxjs'
import { type IPCMainConfig, type IPCRendererConfig } from '../constants'
import { type ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable'

export const Mainland = (
  { browser, ipc }:
  {
    browser: BrowserWindowSource
    ipc: IpcMainSource<IPCRendererConfig>
  }
): {
  browser: Observable<BrowserWindowAction>
  ipc: Observable<ChannelConfigToSink<IPCMainConfig>>
} => {
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
