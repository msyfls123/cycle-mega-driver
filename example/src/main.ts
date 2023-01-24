import path from 'path'

import { IPC_MAIN_CHANNEL } from 'cycle-mega-driver/lib/constants/ipc';
import {
    BrowserWindowSource,
    IpcMainSource,
    makeBrowserWindowDriver,
    makeIpcMainDriver,
    mergeWithKey,
} from 'cycle-mega-driver/lib/main'
import type { BrowserWindowFunctionPayload } from 'cycle-mega-driver/lib/main/driver/browser-window';
import { ChannelConfigToSink } from 'cycle-mega-driver/lib/utils/observable';
import { BrowserWindow, app } from 'electron';
import { Observable, ReplaySubject, connectable, merge } from 'rxjs'
import { map, startWith, tap } from 'rxjs/operators'

import isolate from '@cycle/isolate'
import { run } from '@cycle/rxjs-run'

import { IPCMainConfig, IPCRendererConfig } from './constants'

app.whenReady().then(() => {
    const win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadURL('about:blank');
    win.webContents.openDevTools({ mode: 'right' })

    const win2 = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win2.loadURL('about:blank#123');
    win2.webContents.openDevTools({ mode: 'bottom' })
    const main = (
        { browser, ipc, }:
        { browser: BrowserWindowSource, ipc: IpcMainSource<IPCMainConfig, IPCRendererConfig> }
    ): {
        browser: Observable<BrowserWindowFunctionPayload>
        ipc: Observable<ChannelConfigToSink<IPCMainConfig>>
    } => {
        const output = merge(
            browser.select('blur').pipe(map(() => 'blur'), startWith('blur')),
            browser.select('focus').pipe(map(() => 'focus')),
        )
        const visible$ = connectable(output, {
            connector: () => new ReplaySubject(1),
        })
        visible$.connect();
        const toggle$ = ipc.select('toggle-focus').pipe(tap(data => console.log(data.data)))
        const browserSink$ = toggle$.pipe(map(({ event, data }) => ({
                id: BrowserWindow.fromWebContents(event.sender).id,
                method: data ? 'focus' as const : 'blur' as const,
                args: [] as [],
        })))
        return {
            browser: browserSink$,
            ipc: mergeWithKey({
                visible: visible$, 
            })
        }
    }
    run(
        isolate(main, {
            ipc: win.webContents.id
        }),
        {
            browser: makeBrowserWindowDriver(),
            ipc: makeIpcMainDriver<IPCMainConfig, IPCRendererConfig>(['visible']),
        },
    )
})
