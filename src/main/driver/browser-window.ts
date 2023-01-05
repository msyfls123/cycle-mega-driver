import { BrowserWindow, app } from 'electron'
import { Subject, from } from 'rxjs'
import { filter } from 'rxjs/operators'

import { adapt } from '@cycle/run/lib/adapt'

interface BrowserWindowEventSubject {
    event: string
    browserWindowId: number
    args: any[]
}

export function makeBrowserWindowDriver() {
    const events = new Set
    const subject = new Subject<BrowserWindowEventSubject>
    function select(e: any) {
        if (!events.has(e)) {
            events.add(e)
            const addEventListener = (win) => {
                win.on(e, (...args) => {
                    subject.next({
                        browserWindowId: win.id,
                        event: e,
                        args,
                    })
                })
            }
            BrowserWindow.getAllWindows().forEach((win) => addEventListener(win))
            app.on('browser-window-created', (ev, win) => addEventListener(win))
        }
        return adapt(subject.pipe(filter(({ event }: any) => event === e )) as any)
    }
    return (sourcesXs$) => {
        sourcesXs$.addListener({
            next: i => console.log(i),
            error: err => console.error(err),
            complete: () => console.log('completed'),
          })
        // const sources = from(sourcesXs$)
        // sources.subscribe(console.log)
        return {
            select,
        }
    }
}
