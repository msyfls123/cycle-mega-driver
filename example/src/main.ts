import { BrowserWindowDriver } from 'cycle-mega-driver/lib/main'
import { BrowserWindow, Notification, app, dialog } from 'electron';
import { merge, timer } from 'rxjs'
import { concatWith } from 'rxjs/operators'

import { run } from '@cycle/rxjs-run'

app.whenReady().then(() => {
    const win = new BrowserWindow;
    win.show();
    console.log(app.eventNames());
    const main = ({ browser }) => {
        const output = merge(
            browser.select('blur'),
            timer(1000).pipe(concatWith(browser.select('focus')))
        )
        return {
            browser: output
        }
    }
    run(main, {
        browser: BrowserWindowDriver()
    })
})
