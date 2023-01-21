import { Obj } from '../utils/observable'

const IPC_PREFIX = '$CYCLE_MEGA_DRIVER$'

export const IPC_MAIN_CHANNEL = `${IPC_PREFIX}_MAIN_CHANNEL`
export const IPC_RENDERER_CHANNEL = `${IPC_PREFIX}_RENDERER_CHANNEL`

export type IpcMainSourceEventPayload<T extends Obj> = {
    type: 'subscribe'
    channels: Array<keyof T>
    uuid: string
}

export type IpcMainSourceEventResponse<T extends Obj> = {
    [K in keyof T]: {
        type: 'next'
        channel: K
        uuid: string
        data: T[K]
    } | {
        type: 'error'
        channel: K
        uuid: string
        error: any
    } | {
        type: 'complete'
        uuid: string
        channel: K
    }
}[keyof T]
