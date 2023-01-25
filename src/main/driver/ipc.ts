import { type IpcMainEvent, ipcMain } from 'electron'
import { type Observable, ReplaySubject, Subject, catchError, connectable, filter, from, map, merge, throwError } from 'rxjs'
import { type Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

import { IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, type IpcMainSourceEventPayload } from '../../constants/ipc'
import { type ChannelConfigToSink, type ChannelConfigToWebSink, type ChannelConfigToWebSource, type MapValueToObservable, type Obj, xsToObservable } from '../../utils/observable'

export const mergeWithKey = <T extends Obj>(input: MapValueToObservable<T>) => {
  return merge(
    ...(Object.entries(input)
      .map(
        ([channel, stream]) => from(stream).pipe(
          map((data) => ({ channel, data })),
          catchError((err) => throwError(() => ({
            channel,
            err
          })))
        )
      )
    )
  ) as Observable<ChannelConfigToWebSink<T>>
}

export class IpcMainSource<Output extends Obj, Input extends Obj> {
  protected rawInput$: Subject<ChannelConfigToWebSource<Input>>
  protected input$: Observable<ChannelConfigToWebSource<Input>>

  public isolateSource = (source: IpcMainSource<Output, Input>, scope: any) => {
    return new PureIpcMainSource<Input>(
      source.getRawInput(),
      scope
    )
  }

  public isolateSink = (sink$: Stream<ChannelConfigToWebSink<Output>>, scope: any) => {
    return adapt(xsToObservable(sink$).pipe(map((payload) => ({
      ...payload,
      webContentsId: scope
    }))) as any)
  }

  public select<K extends keyof Input>(name: K) {
    return adapt(
      this.input$.pipe(
        filter(({ channel }) => name === channel)
      ) as any
    ) as Observable<ChannelConfigToWebSource<Input>>
  }

  private getRawInput () {
    return this.rawInput$
  }
}

class PureIpcMainSource<Input extends Obj> extends IpcMainSource<Obj, Input> {
  constructor (rawInput: Subject<ChannelConfigToWebSource<Input>>, webContentsId: number) {
    super()
    this.rawInput$ = rawInput
    this.input$ = rawInput.pipe(
      filter(({ event }) => webContentsId === event.sender.id)
    )
  }
}

class GlobalIpcMainSource<Output extends Obj, Input extends Obj> extends IpcMainSource<Output, Input> {
  private readonly output$: Observable<ChannelConfigToWebSink<Output>>

  public constructor (
    sink$: Observable<ChannelConfigToWebSink<Output>>,
    cached: Array<keyof Output>
  ) {
    super()

    this.rawInput$ = new Subject()
    this.input$ = this.rawInput$.asObservable()

    this.output$ = merge(
      ...cached.map((name) => {
        const conn = connectable(
          sink$.pipe(filter(({ channel }) => channel === name)),
          { connector: () => new ReplaySubject(1) }
        )
        conn.connect()
        return conn
      }),
      sink$.pipe(filter(({ channel }) => !cached.includes(channel)))
    )

    this.setup()
  }

  private setup () {
    ipcMain.on(IPC_MAIN_CHANNEL, this.handleSubscribe)
    ipcMain.on(IPC_RENDERER_CHANNEL, this.handleIpcMessageFromRenderer)
  }

  private dispose () {
    ipcMain.off(IPC_MAIN_CHANNEL, this.handleSubscribe)
    ipcMain.off(IPC_RENDERER_CHANNEL, this.handleIpcMessageFromRenderer)
  }

  private readonly handleIpcMessageFromRenderer = (event: IpcMainEvent, payload: ChannelConfigToSink<Input>) => {
    this.rawInput$.next({
      event,
      channel: payload.channel,
      data: payload.data
    })
  }

  private readonly handleSubscribe = (event: IpcMainEvent, payload: IpcMainSourceEventPayload<Output>) => {
    const { uuid } = payload
    if (payload.type === 'subscribe') {
      const subscription = this.output$.pipe(
        filter(({ channel, webContentsId }) => {
          return payload.channels.includes(channel) &&
                        (typeof webContentsId === 'undefined' || webContentsId === event.sender.id)
        })
      ).subscribe({
        next: (res) => {
          event.reply(IPC_MAIN_CHANNEL, {
            type: 'next',
            uuid,
            ...res
          })
        },
        error: ({ err, channel }) => {
          event.reply(IPC_MAIN_CHANNEL, {
            type: 'error',
            channel,
            uuid,
            error: err
          })
        }
      })
      event.sender.once('destroyed', () => {
        subscription.unsubscribe()
      })
    }
  }
}

export function makeIpcMainDriver<Output extends Obj, Input extends Obj> (cached: Array<keyof Output>) {
  return (xs$: Stream<ChannelConfigToWebSink<Output>>) => {
    const sink$ = xsToObservable(xs$)
    return new GlobalIpcMainSource<Output, Input>(sink$, cached)
  }
}
