import { ipcMain } from 'electron'
import { Observable, ReplaySubject, Subject, catchError, connectable, filter, from, map, merge, throwError } from 'rxjs'
import { Stream } from 'xstream'

import { IPC_MAIN_CHANNEL, IPC_RENDERER_CHANNEL, IpcMainSourceEventPayload } from '../../constants/ipc'
import { ChannelConfigToSink, ChannelConfigToWebSink, MapValueToObservable, Obj } from "../../utils/observable"

export const mergeWithKey = <T extends Obj>(input: MapValueToObservable<T>) => {
    return merge(
        ...(Object.entries(input)
            .map(
                ([channel, stream]) => from(stream).pipe(
                    map((data) => ({ channel, data })),
                    catchError((err) => throwError(() => ({
                        channel,
                        err,
                    })))
                )
            )
        )
    ) as Observable<ChannelConfigToSink<T>>
}

export class IpcMainSource<Output extends Obj, Input extends Obj> {
    private output$: Observable<ChannelConfigToSink<Output>>
    private input$: Subject<ChannelConfigToWebSink<Input>>
    constructor(
        sink$: Observable<ChannelConfigToSink<Output>>,
        cached: Array<keyof Output>,
    ) {
        this.input$ = new Subject
        ipcMain.on(IPC_RENDERER_CHANNEL, (event, payload: ChannelConfigToSink<Input>) => {
            this.input$.next({
                event,
                channel: payload.channel,
                data: payload.data,
            })
        })

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
        ipcMain.on(IPC_MAIN_CHANNEL, this.handleSubscribe.bind(this))
    }

    public select<K extends keyof Input>(name: K) {
        return this.input$.pipe(filter(({ channel }) => name === channel))
    }

    private handleSubscribe(event, payload: IpcMainSourceEventPayload<Output>) {
        const { uuid } = payload
        if (payload.type === 'subscribe') {
            const subscription = this.output$.pipe(
                filter(({ channel }) => payload.channels.includes(channel))
            ).subscribe({
                next: (res) => {
                    event.reply(IPC_MAIN_CHANNEL, {
                        type: 'next',
                        uuid,
                        ...res,
                    })
                },
                error: ({ err, channel }) => {
                    event.reply(IPC_MAIN_CHANNEL, {
                        type: 'error',
                        channel,
                        uuid,
                        error: err,
                    })
                },
            })
            event.sender.once('destroyed', () => {
                subscription.unsubscribe()
            })
        }
    }
}

export function makeIpcMainDriver<Output extends Obj, Input extends Obj>(cached: Array<keyof Output>) {
    return (xs$: Stream<ChannelConfigToSink<Output>>) => {
        const sink$ = new Observable<ChannelConfigToSink<Output>>((subscriber) => {
            xs$.addListener({
                next: subscriber.next.bind(subscriber),
                complete: subscriber.complete.bind(subscriber),
                error: subscriber.error.bind(subscriber)
            })
        })
        return new IpcMainSource<Output, Input>(sink$, cached)
    }
}
