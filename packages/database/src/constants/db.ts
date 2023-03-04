// import { ICollectionRxOptions } from 'rx-pouch/dist/Collection'
import { IModel } from 'rx-pouch/dist/interfaces/IModel'
import { Observable } from 'rxjs'

export type Model = Record<string, IModel>
export type DocType<M extends Model> = keyof M & string

export type Comparators = string | never

export type ComparatorMap<M, C extends Comparators> = {
  [K in C]: (value: M, filter: M) => boolean
}

type BaseComparators = 'gt' | 'lt' | 'includes'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
}

type RecursiveFilterType<T, C extends Comparators> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? RecursiveFilterType<T[P], C> : BaseComparators | C ;
}

export interface ICollectionOptions<M extends IModel, C extends Comparators = never> {
  filter?: Observable<{
    $?: keyof M
  } & RecursivePartial<M>>
  filterType?: Observable<RecursiveFilterType<M, C>>
  sort?: Observable<{
    field: keyof M
    reverse?: boolean
  }>
  // comparators: C extends string ? ComparatorMap<M, C> : never
}
