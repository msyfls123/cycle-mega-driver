import { CustomMain, PickComponent } from '@cycle-mega-driver/common/lib'
import { makeIpcRendererDriverNg } from '@cycle-mega-driver/electron/lib/renderer'
import { makeDOMDriver } from '@cycle/dom/lib/cjs/rxjs'

import { IPCMainConfig, IPCRendererConfig } from '../constants'

export const RENDERER_DRIVERS = {
  ipc: makeIpcRendererDriverNg<IPCRendererConfig, IPCMainConfig>(),
  dom: makeDOMDriver('body'),
}

type RendererDrivers = typeof RENDERER_DRIVERS

export type MainRendererComponent = CustomMain<RendererDrivers>
export type MatchRendererMain<Options extends {
  SourceKeys: keyof RendererDrivers
  SinkKeys?: keyof RendererDrivers
  ExtraSources?: unknown
  ExtraSinks?: unknown
}> = PickComponent<RendererDrivers, Options>
