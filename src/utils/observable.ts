import type { IpcMainEvent } from 'electron'
import { Observable } from 'rxjs'

export type Obj = Record<string, any>

export type ChannelConfigToSink<T extends Obj> = {
    [K in keyof T]: {
        channel: K
        data: T[K]
    }
}[keyof T]

export type ChannelConfigToWebSink<T extends Obj> = {
    [K in keyof T]: {
        channel: K
        data: T[K]
        event: IpcMainEvent
    }
}[keyof T]

export type MapValueToObservable<T extends Obj> = {
    [K in keyof T]: Observable<T[K]>
};
