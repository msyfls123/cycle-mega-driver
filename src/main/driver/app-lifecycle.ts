import { app } from 'electron'
import { adaptObservable, xsToObservable, type IntoEntries, pick } from '../../utils/observable'
import { type Observable, fromEvent, withLatestFrom, startWith } from 'rxjs'

import { type Stream } from 'xstream'

interface AppLifecycleAction {
  state: 'default' | 'quit' | 'exit'
  isQuittingEnabled: boolean
  exitCode: number
}

export type AppLifecycleSink = IntoEntries<AppLifecycleAction>

export class AppLifecycleSource {
  /**
   * You should do almost everything after this.
   */
  public ready$ = adaptObservable(fromEvent(app, 'ready'))

  /**
   * Maybe a good time to quit app.
   */
  public windowAllClosed$ = adaptObservable(fromEvent(app, 'window-all-closed'))
  /**
   * Time to do something, your app is going to quit!
   */
  public beforeQuit$ = adaptObservable(fromEvent(app, 'before-quit', (e: Event) => e))
  /**
   * Your app is quitting, do some resources disposition.
   */
  public willQuit$ = adaptObservable(fromEvent(app, 'will-quit'))

  /**
   * App will quit right now with the code.
   */
  public quit$ = adaptObservable(fromEvent(app, 'quit', (e, exitCode: number) => ({ exitCode })))

  constructor (sink$: Observable<AppLifecycleSink>) {
    const state$ = sink$.pipe(pick('state'), startWith('default' as const))
    const isQuittingEnabled$ = sink$.pipe(pick('isQuittingEnabled'), startWith(true))
    const exitCode$ = sink$.pipe(pick('exitCode'), startWith(0))

    state$.pipe(
      withLatestFrom(exitCode$)
    ).subscribe(([state, exitCode]) => {
      switch (state) {
        case 'quit':
          app.quit()
          break
        case 'exit':
          app.exit(exitCode)
          break
      }
    })

    this.beforeQuit$.pipe(
      withLatestFrom(isQuittingEnabled$)
    ).subscribe(([quitEvent, isQuittingEnabled]) => {
      if (!isQuittingEnabled) {
        quitEvent.preventDefault()
      }
    })
  }
}

export function makeAppLifecyleDriver () {
  return (xs$: Stream<AppLifecycleSink>) => {
    const sink$ = xsToObservable(xs$)
    return new AppLifecycleSource(sink$)
  }
}
