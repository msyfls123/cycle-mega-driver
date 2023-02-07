import { type IpcMainEvent, ipcMain, BrowserWindow } from 'electron'
import { type Observable, ReplaySubject, Subject, connectable, filter, map, merge } from 'rxjs'
import { type Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

import { IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, type IpcMainSourceEventPayload } from '../../constants/ipc'
import { type ChannelConfigToSink, type ChannelConfigToWebSink, type ChannelConfigToWebSource, type MapValueToObservable, type Obj, xsToObservable, intoEntries } from '../../utils/observable'

export const mapToIpcSink = <T extends Obj>(input: MapValueToObservable<T>) => {
  return intoEntries(input).pipe(
    map(({ key, value }) => ({ channel: key, data: value }))
  ) as Observable<ChannelConfigToWebSink<T>>
}

export class IpcMainSource<Input extends Obj> {
  protected rawInput$: Subject<ChannelConfigToWebSource<Input>>
  protected input$: Observable<ChannelConfigToWebSource<Input>>

  public static isolateSource = <Input extends Obj>(source: IpcMainSource<Input>, scope: any) => {
    return new PureIpcMainSource<Input>(
      source.getRawInput(),
      scope ?? undefined
    )
  }

  public static isolateSink = <Output extends Obj>(sink$: Stream<ChannelConfigToWebSink<Output>>, scope: any) => {
    return adapt(xsToObservable(sink$).pipe(map((payload) => ({
      ...payload,
      webContentsId: scope ?? undefined
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

class PureIpcMainSource<Input extends Obj> extends IpcMainSource<Input> {
  constructor (rawInput: Subject<ChannelConfigToWebSource<Input>>, webContentsId: number) {
    super()
    this.rawInput$ = rawInput
    this.input$ = rawInput.pipe(
      filter(({ event }) => typeof webContentsId === 'undefined' || webContentsId === event.sender.id)
    )
  }
}

class GlobalIpcMainSource<Output extends Obj, Input extends Obj> extends IpcMainSource<Input> {
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
      data: payload.data,
      browserWindow: BrowserWindow.fromWebContents(event.sender) ?? undefined,
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
