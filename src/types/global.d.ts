/* eslint-disable @typescript-eslint/consistent-type-imports */
import { ipcInterceptor } from '../renderer/preload'
import { IPC_INTERCEPTOR } from '../constants/ipc'

declare global {
  interface Window {
    [IPC_INTERCEPTOR]: typeof ipcInterceptor
  }
}

export {}
