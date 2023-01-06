import {
    BrowserWindowSource,
    IpcMainSource,
    makeBrowserWindowDriver,
    makeIpcMainDriver,
} from 'cycle-mega-driver/lib/main'
import type { BrowserWindowFunctionPayload } from 'cycle-mega-driver/lib/main/driver/browser-window';
import type { InvokeResponse } from 'cycle-mega-driver/lib/main/driver/ipc';
import { BrowserWindow, app, } from 'electron';
import { Observable, ReplaySubject, connectable, merge, of, timer } from 'rxjs'
import { concatWith, map } from 'rxjs/operators'

import { run } from '@cycle/rxjs-run'

app.whenReady().then(() => {
    const win = new BrowserWindow({
        webPreferences: {
            sandbox: false,
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.loadURL('about:blank');
    win.webContents.openDevTools({ mode: 'right' })
    const main = ({ browser, ipc }: {ipc: IpcMainSource, browser: BrowserWindowSource }): {
        browser: Observable<BrowserWindowFunctionPayload>
        ipc: Observable<InvokeResponse>
    } => {
        const output = merge(
            browser.select('blur').pipe(map(() => 'blur')),
            timer(1000).pipe(
                concatWith(browser.select('focus')),
                map(() => 'focus')
            )
        )
        const visible$ = connectable(output, {
            connector: () => new ReplaySubject(1),
            resetOnDisconnect: false,
        })
        visible$.connect();
        const ipcOutput$ = ipc.handle('visible', () => visible$)
        const toggle$ = ipc.handle('toggle-focus', () => of({}))
        const browserSink$ = toggle$.pipe(map(({ payload: { data, rawEvent } }) => ({
                id: BrowserWindow.fromWebContents(rawEvent.sender).id,
                method: 'blur' as const,
                args: [] as [],
        })))
        return {
            browser: browserSink$,
            ipc: merge(ipcOutput$, toggle$),
        }
    }
    run(main, {
        browser: makeBrowserWindowDriver(),
        ipc: makeIpcMainDriver(),
    })
})
