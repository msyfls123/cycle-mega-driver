// import { IModel } from 'rx-pouch/dist/interfaces/IModel'

import { IntoEntries } from '@cycle-mega-driver/common/lib'

import { Comparators, DocType, ICollectionOptions, Model } from './db'

export interface CollectionPayload<M extends Model, C extends Comparators, K extends string, T extends DocType<M> = DocType<M>> {
  docType: T
  category: K
  observableOptions: ICollectionOptions<M[T], C>
}

export interface CreatePayload<M extends Model, T extends DocType<M>, Category extends string> {
  doc: Omit<M[T], '_id'> & Pick<Partial<M[T]>, '_id'>
  category: Category
  docType: T
}

export interface DocPayload<M extends Model, T extends DocType<M>, Category extends string> {
  doc: M[T]
  category: Category
  docType: T
}

export interface SetupPayload {
  dbDir: string
}

export interface DocumentConfig<M extends Model, T extends DocType<M>, Category extends string> {
  create: CreatePayload<M, T, Category>
  update: DocPayload<M, T, Category>
  remove: DocPayload<M, T, Category>
}

export interface DatabaseConfig<
  M extends Model,
  C extends Comparators,
  Category extends string
> extends DocumentConfig<M, DocType<M>, Category> {
  collection: CollectionPayload<M, C, Category>
  setup: SetupPayload
}

export type DatabaseSink<M extends Model, C extends Comparators, Category extends string> = IntoEntries<DatabaseConfig<M, C, Category>>
