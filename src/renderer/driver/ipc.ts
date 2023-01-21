import { Obj } from 'cycle-mega-driver/src/utils/observable';
import { ipcRenderer } from 'electron';
import { Observable } from 'rxjs';

import { IPC_CHANNEL, IpcMainSourceEventResponse } from '../../constants/ipc';

export class IpcRendererSource<Output extends Obj, Input extends Obj> {
    public select<K extends keyof Input>(name: K) {
        ipcRenderer.send(IPC_CHANNEL, {
            type: 'subscribe',
            channels: [name],
        })
        const observable = new Observable((subscriber) => {
            ipcRenderer.on(IPC_CHANNEL, (event, res: IpcMainSourceEventResponse<Input>) => {
                if (res.channel !== name) return
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
