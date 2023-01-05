import { adapt } from '@cycle/run/lib/adapt'
import { IpcMainInvokeEvent, ipcMain, webContents } from 'electron'
import { Observable, Subject, catchError, filter, map, mergeMap, of } from 'rxjs'
import { Stream } from 'xstream'

interface InvokePayload {
    rawEvent: IpcMainInvokeEvent
    channel: string
    data: any
    resolve: Function
    reject: Function
}

interface InvokeResponse {
    payload: InvokePayload
    data: any
    error?: Error
}

export class IpcMainSource {
    private events = new Set
    private invokeEvents = new Set
    private event$ = new Subject
    private invoke$ = new Subject<InvokePayload>
    public constructor(public invokeResult$: Observable<InvokeResponse>) {
        invokeResult$.subscribe(({ error, payload, data }) => {
            if (error) {
                payload.reject(error)
            } else {
                payload.resolve(data)
            }
        })
    }
    public handle<T = any>(event: string, handler: (payload: InvokePayload) => Observable<T>) {
        if (!this.invokeEvents.has(event)) {
            this.invokeEvents.add(event)
            ipcMain.handle(event, (rawEvent, data) => {
                return new Promise((resolve, reject) => {
                    this.invoke$.next({
                        rawEvent,
                        channel: event,
                        data,
                        resolve,
                        reject,
                    })
                })
            })
        }
        return adapt(this.invoke$.pipe(
            filter(({ channel }) => channel === event),
            mergeMap(
                (payload) => handler(payload).pipe(
                    map((data) => ({
                        payload,
                        data,
                    })),
                    catchError((error) => of({
                        payload,
                        data: null,
                        error,
                    }))
                )
            )
        ) as any) as Observable<InvokeResponse>
    }

}
export function makeIpcMainDriver() {
    return (xs$: Stream<InvokeResponse>) => {
        const invokeResult$ = new Observable<InvokeResponse>((subscriber) => {
            xs$.addListener({
              next: subscriber.next.bind(subscriber),
              complete: subscriber.complete.bind(subscriber),
              error: subscriber.error
            })
        })
        return new IpcMainSource(invokeResult$)
    }
}
