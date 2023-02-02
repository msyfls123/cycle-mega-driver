import { BrowserWindow } from 'electron'
import { BehaviorSubject, map, scan, tap } from 'rxjs'

export function getAllWindows () {
  interface AllWindowEvent {
    type: 'initial' | 'add' | 'remove'
    windows: BrowserWindow[]
  }
  const existed = BrowserWindow.getAllWindows()
  const subject = new BehaviorSubject<AllWindowEvent>({
    type: 'initial',
    windows: existed
  })

  const windows$ = subject.pipe(
    tap(({ type, windows }) => {
      if (type !== 'remove') {
        windows.forEach(win => {
          win.once('closed', () => {
            subject.next({
              type: 'remove',
              windows: [win]
            })
          })
        })
      }
    }),
    scan((acc, payload) => {
      switch (payload.type) {
        case 'initial':
          return new Set(payload.windows)
        case 'add':
          payload.windows.forEach(acc.add, acc)
          return acc
        case 'remove':
          payload.windows.forEach(acc.delete, acc)
          return acc
      }
    }, new Set<BrowserWindow>()),
    map(set => Array.from(set))
  )

  return windows$
}
