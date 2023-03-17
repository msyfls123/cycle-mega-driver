import { makeBrowserWindowDriver, makeIpcMainDriver, makeApplicationMenuDriver, makeAppLifecyleDriver } from '@cycle-mega-driver/electron/lib/main'
import { COMPARATORS, CategoryDocTypeMap, DatabaseExtraComparators, DatabaseModel, type IPCMainConfig, type IPCRendererConfig, type MenuId } from '../constants'
import { type PickComponent, type CustomMain } from '@cycle-mega-driver/common/lib'
import { makeDatabaseDriver } from '@cycle-mega-driver/database/lib'

export const MAIN_DRIVERS = {
  browser: makeBrowserWindowDriver(),
  ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible', 'user-list']),
  menu: makeApplicationMenuDriver<MenuId>(),
  lifecycle: makeAppLifecyleDriver(),
  database: makeDatabaseDriver<DatabaseModel, DatabaseExtraComparators, CategoryDocTypeMap>(COMPARATORS)
}

type MainDrivers = typeof MAIN_DRIVERS

export type MainComponent = CustomMain<MainDrivers>
export type MatchMain<Options extends {
  SourceKeys: keyof MainDrivers
  SinkKeys?: keyof MainDrivers
  ExtraSources?: unknown
  ExtraSinks?: unknown
  RestArgs?: any[]
}> = PickComponent<MainDrivers, Options['RestArgs'], Options>
