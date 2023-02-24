import type { BrowserWindow, IpcMainEvent } from 'electron'
import { Observable, map } from 'rxjs'
import { type IpcScope } from '../constants/ipc'
import { MapValueToObservable, intoEntries, type Obj } from '@cycle-mega-driver/common/lib'

export const mapToIpcSink = <T extends Obj>(input: MapValueToObservable<T>) => {
  return intoEntries(input).pipe(
    map(({ key, value }) => ({ channel: key, data: value }))
  ) as Observable<ChannelConfigToWebSink<T>>
}

/**
 * raw messages between main and renderer
 */
export type ChannelConfigToSink<T extends Obj> = {
  [K in keyof T]: {
    channel: K
    data: T[K]
  }
}[keyof T]

export interface IpcSource<Channel, Data> {
  channel: Channel
  data: Data
  event: IpcMainEvent
  browserWindow?: BrowserWindow
}

/**
 * renderer to main messages
 */
export type ChannelConfigToWebSource<T extends Obj> = {
  [K in keyof T]: IpcSource<K, T[K]>
}[keyof T]

/**
 * main to renderer messages
 */
export type ChannelConfigToWebSink<T extends Obj> = {
  [K in keyof T]: {
    channel: K
    data: T[K]
  } & IpcScope
}[keyof T]
