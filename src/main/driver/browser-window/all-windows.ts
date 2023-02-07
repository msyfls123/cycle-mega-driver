import { BrowserWindow, app } from 'electron'
import { ReplaySubject, Subject, connectable, filter, map, scan, tap } from 'rxjs'

export function getAllWindows () {
  interface AllWindowEvent {
    type: 'add' | 'remove'
    window: BrowserWindow
  }
  const existed = BrowserWindow.getAllWindows()
  const subject = new Subject<AllWindowEvent>()

  const add = (win) => {
    subject.next({
      type: 'add',
      window: win,
    })
  }
  app.on('browser-window-created', (e, window) => { add(window) })

  const windows$ = subject.pipe(
    tap(({ type, window }) => {
      if (type !== 'remove') {
        window.once('closed', () => {
          subject.next({
            type: 'remove',
            window,
          })
        })
      }
    }),
    scan((acc, payload) => {
      switch (payload.type) {
        case 'add':
          acc.add(payload.window)
          return acc
        case 'remove':
          acc.delete(payload.window)
          return acc
      }
    }, new Set<BrowserWindow>()),
    map(set => Array.from(set))
  )

  const allWindows$ = connectable(windows$, {
    connector: () => new ReplaySubject(1),
  })
  allWindows$.connect()

  const newWindow$ = connectable(
    subject.pipe(filter(({ type }) => type === 'add'), map(({ window }) => window)),
    {
      connector: () => new ReplaySubject(1),
    },
  )
  newWindow$.connect()

  existed.forEach(add)

  return {
    allWindows$,
    newWindow$,
  }
}
