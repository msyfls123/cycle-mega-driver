import { Obj } from 'cycle-mega-driver/src/utils/observable';
import { ipcRenderer } from 'electron';
import { Observable } from 'rxjs';

import { IPC_CHANNEL, IpcMainSourceEventPayload, IpcMainSourceEventResponse } from '../../constants/ipc';

let uuid = 0

export class IpcRendererSource<Output extends Obj, Input extends Obj> {
    public select<K extends keyof Input>(name: K) {
        uuid += 1
        const channelUUID = String(uuid)
        ipcRenderer.send(IPC_CHANNEL, {
            type: 'subscribe',
            channels: [name],
            uuid: channelUUID,
        } as IpcMainSourceEventPayload<Input[K]>)
        const observable = new Observable((subscriber) => {
            ipcRenderer.on(IPC_CHANNEL, (event, res: IpcMainSourceEventResponse<Input>) => {
                if (!(res.channel === name && res.uuid === channelUUID)) return
                switch (res.type) {
                    case 'next':
                        subscriber.next(res.data)
                        break
                    case 'error':
                        subscriber.error(res.error)
                    case 'complete':
                        subscriber.complete()
                        break
                    default:
                        break
                }
            })
        })
        return observable
    }
}

export function makeIpcRendererDriverNg<Output extends Obj, Input extends Obj>() {
    return () => {
        return new IpcRendererSource<Output, Input>()
    }
}
