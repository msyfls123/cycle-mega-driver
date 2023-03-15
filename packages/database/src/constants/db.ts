// import { ICollectionRxOptions } from 'rx-pouch/dist/Collection'
import { IModel } from 'rx-pouch/dist/interfaces/IModel'
import { Observable } from 'rxjs'

export type Doc = IModel
export type Model = Record<string, IModel>
export type DocType<M extends Model> = keyof M & string
export type DocMethod = 'update' | 'create' | 'remove'

export type Category<M extends Model> = Record<string, DocType<M>>
export type CategoryKey<Cat extends Record<string, unknown>> = keyof Cat & string

export type Comparators = Record<string, unknown> | unknown
export type ComparatorMap<C extends Comparators> = {
  [K in keyof C]: (value: C[K], filter: C[K]) => boolean
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type BaseComparators = {
  gt: number
  lt: number
  includes: string
}

type KeyWithType<Obj extends Record<string, unknown>, T> = {
  [K in keyof Obj]: Obj[K] extends T ? K : never
}[keyof Obj]

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
}

type RecursiveFilterType<T, C extends Comparators> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? RecursiveFilterType<T[P], C> : KeyWithType<C & BaseComparators, T[P]>
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
