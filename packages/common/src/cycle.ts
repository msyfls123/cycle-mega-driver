import { adapt } from '@cycle/run/lib/adapt'
import { Observable } from 'rxjs'
import { type Stream } from 'xstream'

export function xsToObservable<T> (xs$: Stream<T>) {
  return new Observable<T>((subscriber) => {
    xs$.addListener({
      next: subscriber.next.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),
      error: subscriber.error.bind(subscriber)
    })
  })
}

export function adaptObservable<T> (observable: Observable<T>) {
  return adapt(observable as any) as Observable<T>
}
