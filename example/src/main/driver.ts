import { makeBrowserWindowDriver, makeIpcMainDriver, makeApplicationMenuDriver, makeAppLifecyleDriver } from '@cycle-mega-driver/electron/lib/main'
import { DatabaseCategory, DatabaseModel, type IPCMainConfig, type IPCRendererConfig, type MenuId } from '../constants'
import { type PickComponent, type CustomMain } from '@cycle-mega-driver/electron/lib/utils/cyclejs'
import { makeDatabaseDriver } from '@cycle-mega-driver/database/lib'

export const MAIN_DRIVERS = {
  browser: makeBrowserWindowDriver(),
  ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
  menu: makeApplicationMenuDriver<MenuId>(),
  lifecycle: makeAppLifecyleDriver(),
  database: makeDatabaseDriver<DatabaseModel, never, DatabaseCategory>({})
}

type MainDrivers = typeof MAIN_DRIVERS

export type MainComponent = CustomMain<MainDrivers>
export type MatchMain<Options extends {
  SourceKeys: keyof MainDrivers
  SinkKeys?: keyof MainDrivers
  ExtraSources?: unknown
  ExtraSinks?: unknown
}> = PickComponent<MainDrivers, Options>
