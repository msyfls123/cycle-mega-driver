import { ipcRenderer } from 'electron'
import { Observable } from 'rxjs'
import { type Stream } from 'xstream'

import { IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, type IpcMainSourceEventPayload, type IpcMainSourceEventResponse } from '../../constants/ipc'
import { type ChannelConfigToSink, type Obj } from '../../utils/observable'

let uuid = 0

export class IpcRendererSource<Output extends Obj, Input extends Obj> {
  constructor (sink$: Observable<ChannelConfigToSink<Output>>) {
    sink$.subscribe((payload) => {
      ipcRenderer.send(IPC_RENDERER_CHANNEL, payload)
    })
  }

  public select<K extends keyof Input>(name: K) {
    uuid += 1
    const channelUUID = String(uuid)
    ipcRenderer.send(IPC_MAIN_CHANNEL, {
      type: 'subscribe',
      channels: [name],
      uuid: channelUUID
    } as IpcMainSourceEventPayload<Input[K]>)
    const observable = new Observable((subscriber) => {
      ipcRenderer.on(IPC_MAIN_CHANNEL, (event, res: IpcMainSourceEventResponse<Input>) => {
        if (!(res.channel === name && res.uuid === channelUUID)) return
        switch (res.type) {
          case 'next':
            subscriber.next(res.data)
            break
          case 'error':
            subscriber.error(res.error)
            break
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

export function makeIpcRendererDriverNg<Output extends Obj, Input extends Obj> () {
  return (xs$: Stream<ChannelConfigToSink<Output>>) => {
    const sink$ = new Observable<ChannelConfigToSink<Output>>((subscriber) => {
      xs$.addListener({
        next: subscriber.next.bind(subscriber),
        complete: subscriber.complete.bind(subscriber),
        error: subscriber.error.bind(subscriber)
      })
    })
    return new IpcRendererSource<Output, Input>(sink$)
  }
}
