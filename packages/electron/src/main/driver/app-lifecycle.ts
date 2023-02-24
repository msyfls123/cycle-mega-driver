import { type App, app } from 'electron'
import {
  type IntoEntries,
  pickFromEntries,
  type MapValueToObservable,
  intoEntries,
  adaptObservable, xsToObservable
} from '@cycle-mega-driver/common/lib'
import { type Observable, fromEvent, withLatestFrom, startWith, delayWhen, connectable, ReplaySubject, BehaviorSubject, takeUntil, skipUntil, map } from 'rxjs'
import fs from 'fs'
import os from 'os'

import { type Stream } from 'xstream'

type PathName = Parameters<App['getPath']>[0]

const pathNames: PathName[] = [
  'appData', 'desktop', 'documents', 'downloads', 'exe',
  'home', 'module', 'music', 'pictures', 'temp', 'userData', 'videos',
  'logs', 'crashDumps'
]

if (os.platform() === 'win32') {
  pathNames.push('recent')
}

interface AppLifecycleAction {
  state: 'default' | 'quit' | 'exit'
  isQuittingEnabled: boolean
  exitCode: number
  setPath: {
    name: PathName
    path: string
  }
}

export type AppLifecycleSink = IntoEntries<AppLifecycleAction>

export class AppLifecycleSource {
  /**
   * You should do almost everything after this.
   */
  public readonly ready$: Observable<unknown>

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

  /**
   * Used to being piped by other sinks like ipc and browser.
   */
  public whenReady = <T>(observable: Observable<T>) => observable.pipe(
    delayWhen(() => this.ready$)
  )

  public untilReady = <T>(observable: Observable<T>) => this.ready$.pipe(
    withLatestFrom(observable),
    map(([, source]) => source)
  )

  public paths: Record<PathName, Observable<string>>

  private innerPaths: Record<PathName, BehaviorSubject<string>>

  public createSink (input: MapValueToObservable<Partial<AppLifecycleAction>>): Observable<AppLifecycleSink> {
    return intoEntries(input)
  }

  constructor (sink$: Observable<AppLifecycleSink>) {
    const state$ = sink$.pipe(pickFromEntries('state'), startWith('default' as const))
    const isQuittingEnabled$ = sink$.pipe(pickFromEntries('isQuittingEnabled'), startWith(true))
    const exitCode$ = sink$.pipe(pickFromEntries('exitCode'), startWith(0))
    const setPath$ = sink$.pipe(pickFromEntries('setPath'))

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

    const innerReady$ = connectable(
      fromEvent(app, 'ready'),
      { connector: () => new ReplaySubject(1) }
    )
    innerReady$.connect()
    this.ready$ = innerReady$

    this.setupPath(setPath$)
  }

  private setupPath (pathSink: Observable<AppLifecycleAction['setPath']>) {
    this.innerPaths = Object.fromEntries(pathNames.map(name => {
      const subject = new BehaviorSubject(app.getPath(name))
      return [name, subject]
    })) as Record<PathName, BehaviorSubject<string>>

    this.paths = Object.fromEntries(Object.entries(this.innerPaths).map(
      ([name, path$]) => [name, path$.asObservable()]
    )) as Record<PathName, Observable<string>>

    pathSink.pipe(takeUntil(this.ready$)).subscribe(({ name, path }) => {
      this.setPath(name, path)
        .catch((err) => { console.error('Set Path Error', err) })
    })

    pathSink.pipe(skipUntil(this.ready$)).subscribe((action) => {
      throw new Error(`You should not app.setPath after app.ready. [${action.name}: ${action.path}]`)
    })
  }

  private async setPath (name: PathName, path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
    app.setPath(name, path)
    this.innerPaths[name].next(path)
  }
}

export function makeAppLifecyleDriver () {
  return (xs$: Stream<AppLifecycleSink>) => {
    const sink$ = xsToObservable(xs$)
    return new AppLifecycleSource(sink$)
  }
}
