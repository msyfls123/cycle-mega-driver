import { Obj } from '../utils/observable'

const IPC_PREFIX = '$CYCLE_MEGA_DRIVER$'

export const IPC_CHANNEL = `${IPC_PREFIX}_CHANNEL`

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
        channel: K
        error: any
    } | {
        type: 'complete'
        channel: K
    }
}[keyof T]
