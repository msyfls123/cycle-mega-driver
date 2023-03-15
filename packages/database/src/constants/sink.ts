// import { IModel } from 'rx-pouch/dist/interfaces/IModel'

import { IntoEntries } from '@cycle-mega-driver/common/lib'

import { Category, CategoryKey, Comparators, ICollectionOptions, Model } from './db'

export interface CollectionPayload<M extends Model, C extends Comparators, Cat extends Category<M>, K extends CategoryKey<Cat> = CategoryKey<Cat>> {
  docType: Cat[K]
  category: K
  observableOptions: ICollectionOptions<M[Cat[K]], C>
}

export interface CreatePayload<M extends Model, Cat extends Category<M>, K extends CategoryKey<Cat>> {
  doc: Omit<M[Cat[K]], '_id'> & Pick<Partial<M[Cat[K]]>, '_id'>
  category: K
  docType: Cat[K]
}

export interface DocPayload<M extends Model, Cat extends Category<M>, K extends CategoryKey<Cat>> {
  doc: M[Cat[K]]
  category: K
  docType: Cat[K]
}

export interface SetupPayload {
  dbDir: string
}

export interface DocumentConfig<M extends Model, Cat extends Category<M>> {
  create: CreatePayload<M, Cat, CategoryKey<Cat>>
  update: DocPayload<M, Cat, CategoryKey<Cat>>
  remove: DocPayload<M, Cat, CategoryKey<Cat>>
}

export interface DatabaseConfig<
  M extends Model,
  C extends Comparators,
  Cat extends Category<M>
> extends DocumentConfig<M, Cat> {
  collection: CollectionPayload<M, C, Cat>
  setup: SetupPayload
}

export type DatabaseSink<M extends Model, C extends Comparators, Cat extends Category<M>> = IntoEntries<DatabaseConfig<M, C, Cat>>
