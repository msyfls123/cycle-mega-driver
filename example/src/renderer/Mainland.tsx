import { makeDOMDriver, type DOMSource } from '@cycle/dom/lib/cjs/rxjs'
import { type VNode } from '@cycle/dom'
import run from '@cycle/rxjs-run'
import { type IpcRendererSource, makeIpcRendererDriverNg } from '@cycle-mega-driver/electron/lib/renderer'
import { type IPCRendererConfig, type IPCMainConfig } from '../constants'
import { type Observable, map, scan, startWith } from 'rxjs'
import { mapToIpcSink, type ChannelConfigToSink } from '@cycle-mega-driver/electron/lib/utils/observable'

// document.write('hello world')
const main = (
  { ipc, DOM }:
  {
    ipc: IpcRendererSource<IPCRendererConfig, IPCMainConfig>
    DOM: DOMSource
  }
): {
  DOM: Observable<VNode>
  ipc: Observable<ChannelConfigToSink<IPCRendererConfig>>
} => {
  const visible$ = ipc.select('visible').pipe(
    startWith('Start'),
    scan((acc, value) => [...acc, `Val: ${value}, Time: ${new Date().toLocaleString()}`], [])
  )

  const domSink$ = visible$.pipe(
    map(visibles =>
      <div>
        <button className="blur">Blur</button>
        <ul>
          { visibles.map(text => <li>{text}</li>)}
        </ul>
      </div>
    )
  )
  const blur$ = DOM.select('.blur').events('click').pipe(
    map(() => false)
  )
  return {
    DOM: domSink$,
    ipc: mapToIpcSink({
      'toggle-focus': blur$
    })
  }
}

run(main, {
  DOM: makeDOMDriver('body'),
  ipc: makeIpcRendererDriverNg<IPCRendererConfig, IPCMainConfig>()
})
