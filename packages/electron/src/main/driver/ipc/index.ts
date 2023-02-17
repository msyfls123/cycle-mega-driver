import { type IpcMainEvent, ipcMain, BrowserWindow } from 'electron'
import { type Observable, ReplaySubject, Subject, connectable, filter, map, merge } from 'rxjs'
import { type Stream } from 'xstream'

import { adapt } from '@cycle/run/lib/adapt'

import { IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, type IpcScope, type IpcMainSourceEventPayload } from '@src/constants/ipc'
import { type ChannelConfigToSink, type ChannelConfigToWebSink, type ChannelConfigToWebSource, type Obj, xsToObservable, type IpcSource } from '@src/utils/observable'
import { attachIpcSinkScope, matchIpcScope, matchIpcSink } from './isolate'

export { createIpcScope } from './isolate'

type OneEvent<Events extends Obj> = {
  [K in keyof Events]: Pick<Events, K>
}[keyof Events]

export class IpcMainSource<Source extends Obj, Sink extends Obj> {
  select: <K extends keyof Source>(name: K) => Observable<IpcSource<K, Source[K]>>
  createSink: (data: OneEvent<Sink>) => ChannelConfigToWebSink<Sink>
}

class IpcMainSourceImpl<Source extends Obj, Sink extends Obj> implements IpcMainSource<Source, Sink> {
  protected rawInput$: Subject<ChannelConfigToWebSource<Source>>
  protected input$: Observable<ChannelConfigToWebSource<Source>>

  public constructor () {
    Reflect.defineProperty(this, 'isolateSink', {
      value: <Output extends Obj>(
        sink$: Stream<ChannelConfigToWebSink<Output>>,
        scope: IpcScope,
      ) => {
        return adapt(
          xsToObservable(sink$).pipe(map((sink) => attachIpcSinkScope(sink, scope))) as any
        ) as Stream<ChannelConfigToWebSink<Output>>
      }
    })
  }

  public isolateSource = (source: IpcMainSourceImpl<Source, Sink>, scope: IpcScope) => {
    return new PureIpcMainSource<Source, Sink>(
      source.getRawInput(),
      scope
    )
  }

  public select<K extends keyof Source>(name: K) {
    return adapt(
      this.input$.pipe(
        filter(({ channel }) => name === channel)
      ) as any
    ) as Observable<IpcSource<K, Source[K]>>
  }

  public createSink (event: Partial<Sink>): ChannelConfigToWebSink<Sink> {
    const key: keyof Sink = Object.keys(event)[0]
    return {
      data: event[key] as Sink[keyof Sink],
      channel: key,
    }
  }

  private getRawInput () {
    return this.rawInput$
  }
}

class PureIpcMainSource<Source extends Obj, Sink extends Obj> extends IpcMainSourceImpl<Source, Sink> {
  constructor (rawInput: Subject<ChannelConfigToWebSource<Source>>, scope: IpcScope) {
    super()
    this.rawInput$ = rawInput
    this.input$ = rawInput.pipe(
      filter(({ event }) => matchIpcScope(event.sender, scope)),
    )
  }
}

class GlobalIpcMainSource<Source extends Obj, Sink extends Obj> extends IpcMainSourceImpl<Source, Sink> {
  private readonly output$: Observable<ChannelConfigToWebSink<Sink>>

  public constructor (
    sink$: Observable<ChannelConfigToWebSink<Sink>>,
    cached: Array<keyof Sink>
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

  private readonly handleIpcMessageFromRenderer = (event: IpcMainEvent, payload: ChannelConfigToSink<Source>) => {
    this.rawInput$.next({
      event,
      channel: payload.channel,
      data: payload.data,
      browserWindow: BrowserWindow.fromWebContents(event.sender) ?? undefined,
    })
  }

  private readonly handleSubscribe = (event: IpcMainEvent, payload: IpcMainSourceEventPayload<Sink>) => {
    const { uuid, channels, type } = payload
    if (type === 'subscribe') {
      const subscription = this.output$.pipe(
        filter((sink) => {
          const { channel } = sink
          return channels.includes(channel) && matchIpcSink(event.sender, sink)
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
  return (xs$: Stream<ChannelConfigToWebSink<Output>>): IpcMainSource<Input, Output> => {
    const sink$ = xsToObservable(xs$)
    return new GlobalIpcMainSource<Input, Output>(sink$, cached)
  }
}
