import { Category, ComparatorMap, Comparators, Model } from './constants/db'
import { type Stream } from 'xstream'
import { DatabaseConfig } from './constants/sink'
import { IntoEntries, xsToObservable } from '@cycle-mega-driver/common/lib'
import { Database, DatabaseSource } from './database'
import './utils/polyfill'

export function makeDatabaseDriver<M extends Model, C extends Comparators, Cat extends Category<M>> (comparatorMap: ComparatorMap<C>) {
  return (xs$: Stream<IntoEntries<DatabaseConfig<M, C, Cat>>>): DatabaseSource<M, C, Cat> => {
    const sink$ = xsToObservable(xs$)

    return new Database({
      comparatorMap,
      sink$,
    })
  }
}
