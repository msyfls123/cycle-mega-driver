import type { IpcMainEvent } from 'electron'
import { Observable } from 'rxjs'
import { type Stream } from 'xstream'

export type Obj = Record<string, any>

export type ChannelConfigToSink<T extends Obj> = {
  [K in keyof T]: {
    channel: K
    data: T[K]
  }
}[keyof T]

export type ChannelConfigToWebSource<T extends Obj> = {
  [K in keyof T]: {
    channel: K
    data: T[K]
    event: IpcMainEvent
  }
}[keyof T]

export type ChannelConfigToWebSink<T extends Obj> = {
  [K in keyof T]: {
    channel: K
    data: T[K]
    webContentsId?: number
  }
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
