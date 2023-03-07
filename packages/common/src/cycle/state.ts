import { Observable } from 'rxjs'
import xs, { Stream } from 'xstream'

import { StateSource as RawStateSource, Reducer, withState as withStateFn } from '@cycle/state'
import { OSo } from '@cycle/state/lib/cjs/withState'

import { xsToObservable } from './adapt'

export const withState = <
  T,
  Sources extends OSo<T, 'state'> & Record<string, any>,
  Sinks extends { state: Observable<Reducer<T>> } & Record<string, Observable<any>>
>(main: (souces: Sources) => Sinks) => {
  type NormalizedSinks = Omit<Sinks, 'state'> & { state: Stream<Reducer<T>> }
  const wrappedMain = (sources) => {
    const { state: stateSource, ...restSources } = sources
    const newState = proxyStateSource(stateSource)
    const { state: stateSink, ...restSinks } = main({ state: newState, ...restSources })
    return {
      ...restSinks,
      state: xs.fromObservable<Reducer<T>>(stateSink)
    }
  }
  return withStateFn<Sources, NormalizedSinks, T>(wrappedMain)
}

export class StateSource<T> extends RawStateSource<T> {
  public observable: Observable<T>
}

function proxyStateSource<T> (stateSource: RawStateSource<T>) {
  return new Proxy(stateSource, {
    get (target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      if (key === 'observable') {
        return xsToObservable(Reflect.get(target, 'stream', receiver))
      }
      if (key === 'select') {
        return (...args) => {
          const newState = value.call(receiver, ...args)
          return proxyStateSource(newState)
        }
      }
      return value
    }
  })
}
