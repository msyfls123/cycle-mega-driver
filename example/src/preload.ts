import { IpcRendererSource, makeIpcRendererDriverNg } from 'cycle-mega-driver/lib/renderer'
import { contextBridge, ipcRenderer } from 'electron';
import { Observable } from 'rxjs';

import run from '@cycle/rxjs-run';

interface IPCRendererConfig {
    visible: string
}

const main = (
    { ipc }:
    { ipc: IpcRendererSource<{}, IPCRendererConfig> }
): {
    ipc: Observable<{}>
} => {
    contextBridge.exposeInMainWorld('mega', {
        blur: () => {
            ipcRenderer.invoke('toggle-focus');
        },
        isVisible: () => {
            return ipcRenderer.invoke('visible');
        },
        subscribeVisible: (cb) => {
            ipc.select('visible').subscribe(cb)
        }
    })
    return {
        ipc: new Observable
    }
}

run(main, {
    ipc: makeIpcRendererDriverNg<{}, IPCRendererConfig>(),
})
