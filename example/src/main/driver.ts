import { makeBrowserWindowDriver, makeIpcMainDriver, makeApplicationMenuDriver, makeAppLifecyleDriver } from 'cycle-mega-driver/lib/main'
import { type IPCMainConfig, type IPCRendererConfig, type MenuId } from '../constants'
import { type PickComponent, pickDrivers, type CustomMain } from 'cycle-mega-driver/lib/utils/cyclejs'

export const MAIN_DRIVERS = {
  browser: makeBrowserWindowDriver(),
  ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
  menu: makeApplicationMenuDriver<MenuId>(),
  lifecycle: makeAppLifecyleDriver(),
}

type MainDrivers = typeof MAIN_DRIVERS

export type MainComponent = CustomMain<MainDrivers>
export type MatchMain<T extends keyof MainDrivers> = PickComponent<MainDrivers, T>
export const matchDrivers = <T extends keyof MainDrivers>(keys: T[]) => pickDrivers(MAIN_DRIVERS, keys)
