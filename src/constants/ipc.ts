import { Observable } from 'rxjs'

const IPC_PREFIX = '$CYCLE_MEGA_DRIVER$'

export const IPC_CHANNEL = `${IPC_PREFIX}_CHANNEL`

export type Obj = Record<string, any>

export type ChannelConfigToObservable<T extends Obj> = {
    [K in keyof T]: {
        channel: K
        data: T[K]
    }
}[keyof T]

export type MapObservable<T extends Obj> = {
    [K in keyof T]: Observable<T[K]>
}

type Channel<T extends Obj> = keyof T

export type IpcMainSourceEventPayload<T extends Obj> = {
    type: 'subscribe'
    channels: Array<keyof T>
}

export type IpcMainSourceEventResponse<T extends Obj> = {
    [K in keyof T]: {
        type: 'next'
        channel: K
        data: T[K]
    } | {
        type: 'error'
        error: any
    } | {
        type: 'complete'
        channel: K
    }
}[keyof T]
