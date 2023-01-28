import { mergeWithKey } from 'cycle-mega-driver/lib/main'
import { type IpcRendererSource, makeIpcRendererDriverNg } from 'cycle-mega-driver/lib/renderer'
import { type ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable'
import { contextBridge } from 'electron'
import { type Observable, Subject } from 'rxjs'
import 'cycle-mega-driver/dist/preload'

import run from '@cycle/rxjs-run'

import { type IPCMainConfig, type IPCRendererConfig } from './constants'

const main = (
  { ipc }:
  { ipc: IpcRendererSource<IPCRendererConfig, IPCMainConfig> }
): {
  ipc: Observable<ChannelConfigToSink<IPCRendererConfig>>
} => {
  const blur$ = new Subject<boolean>()
  contextBridge.exposeInMainWorld('mega', {
    blur: () => {
      blur$.next(false)
    },
    subscribeVisible: (cb) => {
      ipc.select('visible').subscribe(cb)
    }
  })
  return {
    ipc: mergeWithKey({
      'toggle-focus': blur$
    })
  }
}

run(main, {
  ipc: makeIpcRendererDriverNg<IPCRendererConfig, IPCMainConfig>()
})
