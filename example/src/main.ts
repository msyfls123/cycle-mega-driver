import { a } from 'cycle-mega-driver'
import { BrowserWindow, Notification, app, dialog } from 'electron';
import { timer } from 'rxjs'

app.whenReady().then(() => {
    dialog.showMessageBox({
        message: a.toString(),
    })
    const win = new BrowserWindow;
    win.show();
    timer(3000, 10000).subscribe((time) => {
        new Notification({
            title: time.toString(),
        }).show()
    })
})
