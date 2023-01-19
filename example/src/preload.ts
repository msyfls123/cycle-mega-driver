import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mega', {
    blur: () => {
        ipcRenderer.invoke('toggle-focus');
    },
    isVisible: () => {
        return ipcRenderer.invoke('visible');
    }
})
