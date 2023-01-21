import path from 'path'

import {
    BrowserWindowSource,
    IpcMainSource,
    IpcMainSourceNg,
    makeBrowserWindowDriver,
    makeIpcMainDriver,
    makeIpcMainDriverNg,
    mergeWithKey,
} from 'cycle-mega-driver/lib/main'
import type { BrowserWindowFunctionPayload } from 'cycle-mega-driver/lib/main/driver/browser-window';
import type { InvokeResponse } from 'cycle-mega-driver/lib/main/driver/ipc';
import { ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable';
import { BrowserWindow, app, } from 'electron';
import { Observable, ReplaySubject, connectable, merge, of, throwError, timer } from 'rxjs'
import { concatWith, map, startWith, tap } from 'rxjs/operators'

import { run } from '@cycle/rxjs-run'

interface IPCMainConfig {
    visible: string
}

app.whenReady().then(() => {
    const win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadURL('about:blank');
    win.webContents.openDevTools({ mode: 'right' })
    const main = (
        { browser, ipc, ipcNg, }:
        {ipc: IpcMainSource, browser: BrowserWindowSource, ipcNg: IpcMainSourceNg<IPCMainConfig> }
    ): {
        browser: Observable<BrowserWindowFunctionPayload>
        ipc: Observable<InvokeResponse>
        ipcNg: Observable<ChannelConfigToSink<IPCMainConfig>>
    } => {
        const output = merge(
            browser.select('blur').pipe(map(() => 'blur'), startWith('blur')),
            browser.select('focus').pipe(map(() => 'focus')),
        )
        const visible$ = connectable(output, {
            connector: () => new ReplaySubject(1),
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
            ipcNg: mergeWithKey({
                visible: visible$, 
            })
        }
    }
    run(main, {
        browser: makeBrowserWindowDriver(),
        ipc: makeIpcMainDriver(),
        ipcNg: makeIpcMainDriverNg<IPCMainConfig>(['visible']),
    })
})
