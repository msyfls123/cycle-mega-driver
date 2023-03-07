import { adapt, setAdapt } from '@cycle/run/lib/adapt'
import { Observable } from 'rxjs'
import { type Stream } from 'xstream'

export function xsToObservable<T> (xs$: Stream<T>) {
  if (typeof xs$.addListener !== 'function') {
    return xs$ as unknown as Observable<T>
  }
  return new Observable<T>((subscriber) => {
    xs$.addListener({
      next: subscriber.next.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),
      error: subscriber.error.bind(subscriber)
    })
  })
}

export function setupAdapt () {
  setAdapt((xs$) => {
    if (typeof xs$.addListener === 'function') return xsToObservable(xs$)
    return xs$
  })
}

export function adaptObservable<T> (observable: Observable<T>) {
  return adapt(observable as any) as Observable<T>
}
