import { IPC_CHANNEL } from 'cycle-mega-driver/src/constants/ipc';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mega', {
    blur: () => {
        ipcRenderer.invoke('toggle-focus');
    },
    isVisible: () => {
        return ipcRenderer.invoke('visible');
    },
    subscribeVisible: (cb) => {
        ipcRenderer.send(IPC_CHANNEL, { type: 'subscribe', channels: ['visible']})
        ipcRenderer.on(IPC_CHANNEL, (evt, data) => cb(data))
    }
})
