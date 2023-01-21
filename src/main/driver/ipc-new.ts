import { ipcMain } from 'electron'
import { Observable, ReplaySubject, catchError, connectable, filter, from, map, merge, throwError } from 'rxjs'
import { Stream } from 'xstream'

import { IPC_CHANNEL, IpcMainSourceEventPayload } from '../../constants/ipc'
import { ChannelConfigToSink, MapValueToObservable, Obj } from "../../utils/observable"

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

export class IpcMainSourceNg<T extends Obj> {
    constructor(sink$: Observable<ChannelConfigToSink<T>>, persists: Array<keyof T>) {
        const persistentObservable = merge(
            ...persists.map((name) => {
                const conn = connectable(
                    sink$.pipe(filter(({ channel }) => channel === name)),
                    { connector: () => new ReplaySubject(1) }
                )
                conn.connect()
                return conn
            }),
            sink$.pipe(filter(({ channel }) => !persists.includes(channel)))
        )
        ipcMain.on(IPC_CHANNEL, (event, payload: IpcMainSourceEventPayload<T>) => {
            if (payload.type === 'subscribe') {
                const subscription = persistentObservable.pipe(
                    filter(({ channel }) => payload.channels.includes(channel))
                ).subscribe({
                    next: (res) => {
                        event.reply(IPC_CHANNEL, {
                            type: 'next',
                            ...res,
                        })
                    },
                    error: ({ err, channel }) => {
                        event.reply(IPC_CHANNEL, {
                            type: 'error',
                            channel,
                            error: err,
                        })
                    },
                })
                event.sender.once('destroyed', () => {
                    subscription.unsubscribe()
                })
            }
        })
    }
}

export function makeIpcMainDriverNg<T extends Obj>(persists: Array<keyof T>) {
    return (xs$: Stream<ChannelConfigToSink<T>>) => {
        const sink$ = new Observable<ChannelConfigToSink<T>>((subscriber) => {
            xs$.addListener({
                next: subscriber.next.bind(subscriber),
                complete: subscriber.complete.bind(subscriber),
                error: subscriber.error.bind(subscriber)
            })
        })
        return new IpcMainSourceNg(sink$, persists)
    }
}
