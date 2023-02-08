import { adapt } from '@cycle/run/lib/adapt'
import type { BrowserWindow, IpcMainEvent } from 'electron'
import { Observable, catchError, filter, from, map, merge, throwError } from 'rxjs'
import { type Stream } from 'xstream'
import { type IpcScope } from '../constants/ipc'

export type Obj = Record<string, any>

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

export type MapValueToObservable<T extends Obj> = {
  [K in keyof T]: Observable<T[K]>
}

export function xsToObservable<T> (xs$: Stream<T>) {
  return new Observable<T>((subscriber) => {
    xs$.addListener({
      next: subscriber.next.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),
      error: subscriber.error.bind(subscriber)
    })
  })
}

export function adaptObservable<T> (observable: Observable<T>) {
  return adapt(observable as any) as Observable<T>
}

export type IntoEntries<T extends Obj> = {
  [K in keyof T]: {
    key: K
    value: T[K]
  }
}[keyof T]

/**
 * https://stackoverflow.com/a/65376116
 */
export type FromEntreis<I extends IntoEntries<Obj>> = { [T in I as T['key']]: T['value'] }

export const intoEntries = <T extends Obj>(input: MapValueToObservable<T>) => {
  return merge(
    ...(Object.entries(input)
      .map(
        ([key, stream]) => from(stream).pipe(
          map((value) => ({ key, value })),
          catchError((err) => throwError(() => ({
            key,
            err
          })))
        )
      )
    )
  ) as Observable<IntoEntries<T>>
}

export function pick<T extends IntoEntries<Obj>, K extends T['key']> (name: K) {
  return (source: Observable<T>) => source.pipe(
    filter(({ key }) => key === name),
    map(data => data.value),
  ) as Observable<FromEntreis<T>[K]>
}
