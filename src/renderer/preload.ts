import { contextBridge, ipcRenderer } from 'electron'

import { IPC_INTERCEPTOR, IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, type IpcMainSourceEventResponse } from '../constants/ipc'

export const ipcInterceptor = {
  send (payload: any) {
    ipcRenderer.send(IPC_RENDERER_CHANNEL, payload)
  },
  subscribe (
    channel: string,
    id: string,
    callback: (data: IpcMainSourceEventResponse<any>) => void,
  ) {
    ipcRenderer.send(IPC_MAIN_CHANNEL, {
      type: 'subscribe',
      channels: [channel],
      uuid: id
    })
    const handler = (event, res: IpcMainSourceEventResponse<any>) => {
      if (!(res.channel === channel && res.uuid === id)) return
      callback(res)
    }
    ipcRenderer.on(IPC_MAIN_CHANNEL, handler)
    return () => ipcRenderer.off(IPC_MAIN_CHANNEL, handler)
  },
}

if (process.contextIsolated) {
  // for main world
  contextBridge.exposeInMainWorld(IPC_INTERCEPTOR, ipcInterceptor)
  // for preload
  window[IPC_INTERCEPTOR] = ipcInterceptor
} else {
  Reflect.defineProperty(globalThis, IPC_INTERCEPTOR, ipcInterceptor)
}
