import { IpcMainSource, makeBrowserWindowDriver, makeIpcMainDriver } from 'cycle-mega-driver/lib/main'
import { BrowserWindow, app, } from 'electron';
import { ReplaySubject, connectable, merge, timer } from 'rxjs'
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
    const main = ({ browser, ipc }: {ipc: IpcMainSource, browser: any }) => {
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
        return {
            browser: output,
            ipc: ipcOutput$,
        }
    }
    run(main, {
        browser: makeBrowserWindowDriver(),
        ipc: makeIpcMainDriver(),
    })
})
