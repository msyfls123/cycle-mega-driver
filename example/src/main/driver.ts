import { makeBrowserWindowDriver, makeIpcMainDriver, makeApplicationMenuDriver, makeAppLifecyleDriver } from '@cycle-mega-driver/electron/lib/main'
import { type IPCMainConfig, type IPCRendererConfig, type MenuId } from '../constants'
import { type PickComponent, type CustomMain } from '@cycle-mega-driver/electron/lib/utils/cyclejs'

export const MAIN_DRIVERS = {
  browser: makeBrowserWindowDriver(),
  ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
  menu: makeApplicationMenuDriver<MenuId>(),
  lifecycle: makeAppLifecyleDriver(),
}

type MainDrivers = typeof MAIN_DRIVERS

export type MainComponent = CustomMain<MainDrivers>
export type MatchMain<Options extends {
  SourceKeys: keyof MainDrivers
  SinkKeys?: keyof MainDrivers
  ExtraSources?: unknown
  ExtraSinks?: unknown
}> = PickComponent<MainDrivers, Options>
