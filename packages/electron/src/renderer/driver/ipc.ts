import { Observable } from 'rxjs'
import { type Stream } from 'xstream'

import { IPC_INTERCEPTOR, type IpcMainSourceEventResponse } from '../../constants/ipc'
import { Obj, adaptObservable } from '@cycle-mega-driver/common/lib'
import { ChannelConfigToSink } from '@src/utils'

let uuid = 0
export class IpcRendererSource<Output extends Obj, Input extends Obj> {
  constructor (sink$: Observable<ChannelConfigToSink<Output>>) {
    sink$.subscribe((payload) => {
      window[IPC_INTERCEPTOR].send(payload)
    })
  }

  public select<K extends keyof Input>(name: K) {
    uuid += 1
    const channelUUID = String(uuid)
    const observable = new Observable<Input[K]>((subscriber) => {
      const handler = (res: IpcMainSourceEventResponse<Input>) => {
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
      }
      return window[IPC_INTERCEPTOR].subscribe(name as string, channelUUID, handler)
    })
    return adaptObservable(observable)
  }

  public createSink <T extends keyof Output> (channel: T, data: Output[T]): ChannelConfigToSink<Output> {
    return {
      channel,
      data,
    }
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
