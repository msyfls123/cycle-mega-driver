import pouchLevelDB from 'pouchdb-adapter-leveldb'
import RxPouch from 'rx-pouch'
import { Collection, ICollectionRxOptions } from 'rx-pouch/dist/Collection'
import type RxPouchDatabase from 'rx-pouch/dist/Db'
import { Connectable, Observable, ReplaySubject, Subject, connectable, filter, map, scan } from 'rxjs'

import { pickFromEntries } from '@cycle-mega-driver/common/lib'
import { ComparatorMap, Comparators, DocMethod, DocType, Model } from '@src/constants/db'
import { CollectionPayload, CreatePayload, DatabaseConfig, DatabaseSink, DocPayload, SetupPayload } from '@src/constants/sink'
import { DatabaseDocsSource, DocsSources, ErrorSource } from '@src/constants/source'

RxPouch.plugin(pouchLevelDB)

interface DatabaseCtorOptions<M extends Model, C extends Comparators, Category extends string> {
  comparatorMap: ComparatorMap<M, C>
  sink$: Observable<DatabaseSink<M, C, Category>>
}

export class DatabaseSource<M extends Model, C extends Comparators, Category extends string = string> {
  select: <K extends Category, T extends DocType<M>> (category: K, docType: T) => Observable<DatabaseDocsSource<M, K, T>>

  createSink<T extends DocType<M>>(key: 'create', payload: CreatePayload<M, T, Category>): DatabaseSink<M, C, Category>
  createSink<T extends DocType<M>>(key: 'update', payload: DocPayload<M, T, Category>): DatabaseSink<M, C, Category>
  createSink<T extends DocType<M>>(key: 'remove', payload: DocPayload<M, T, Category>): DatabaseSink<M, C, Category>
  createSink (key: 'setup', payload: SetupPayload): DatabaseSink<M, C, Category>
  createSink<K extends Category, T extends DocType<M>>(key: 'collection', payload: CollectionPayload<M, C, K, T>)
  createSink<K extends keyof DatabaseConfig<M, C, Category>>(
    key: K,
    data: DatabaseConfig<M, C, Category>[K]
  ): DatabaseSink<M, C, Category> {
    return {
      key,
      value: data
    } as DatabaseSink<M, C, Category>
  }

  category: <K extends Category> (category: K) => Observable<void>
  errors: <K extends Category> (category: K) => Observable<ErrorSource<K>>
}

class Database<M extends Model, C extends Comparators, Category extends string = string> implements Database<M, C, Category> {
  private db: RxPouchDatabase
  private readonly comparatorMap: ComparatorMap<M, C>

  private readonly collectionCache = new Map<keyof M, Collection<M[keyof M]>>()

  private readonly docsSubject = new Subject<DocsSources<M, Category>[DocType<M>]>()
  private readonly errorsSubject = new Subject<ErrorSource<Category>>()
  private readonly categorySubject = new Subject<Category>()
  private readonly categoryConn: Connectable<Set<Category>>

  public constructor (options: DatabaseCtorOptions<M, C, Category>) {
    const { sink$, comparatorMap } = options
    this.comparatorMap = comparatorMap

    const collection$ = sink$.pipe(pickFromEntries('collection'))
    collection$.subscribe(this.handleCollectionSink.bind(this))

    this.handleDocumentSink(sink$)

    const setup$ = sink$.pipe(pickFromEntries('setup'))
    setup$.subscribe(({ dbDir }) => {
      const db = new RxPouch(dbDir) as RxPouchDatabase
      db.changes()
      this.db = db
    })

    const categoryConn = connectable(
      this.categorySubject.pipe(scan((acc, val) => acc.add(val), new Set<Category>())),
      { connector: () => new ReplaySubject(1) },
    )
    categoryConn.connect()
    this.categoryConn = categoryConn
  }

  public select<K extends Category, T extends DocType<M>> (category: K, docType: T) {
    return this.docsSubject.asObservable().pipe(
      filter(({ category: currCategory, docType: currDocType }) => currCategory === category && currDocType === docType)
    ) as Observable<DatabaseDocsSource<M, K, T>>
  }

  public errors<K extends Category> (category: K) {
    return this.errorsSubject.asObservable().pipe(
      filter(({ category: currCategory }) => currCategory === category)
    ) as Observable<ErrorSource<K>>
  }

  public category<K extends Category> (category: K) {
    return this.categoryConn.pipe(
      filter((set) => set.has(category)),
      map(() => {})
    )
  }

  public createSink<K extends keyof DatabaseConfig<M, C, Category>>(
    key: K,
    data: DatabaseConfig<M, C, Category>[K]
  ): DatabaseSink<M, C, Category> {
    return {
      key,
      value: data
    } as DatabaseSink<M, C, Category>
  }

  private handleDocumentSink (sink$: Observable<DatabaseSink<M, C, Category>>) {
    const create$ = sink$.pipe(pickFromEntries('create'))
    create$.subscribe(({ category, doc }) => {
      const item: M[keyof M] = { _id: 'test', ...doc } as M[keyof M]
      this.manipulateDoc(category, item, 'create')
    })

    const update$ = sink$.pipe(pickFromEntries('update'))
    update$.subscribe(({ category, doc }) => {
      this.manipulateDoc(category, doc, 'update')
    })

    const remove$ = sink$.pipe(pickFromEntries('remove'))
    remove$.subscribe(({ category, doc }) => {
      this.manipulateDoc(category, doc, 'remove')
    })
  }

  private manipulateDoc (category: Category, item: M[keyof M], method: DocMethod) {
    const { type: docType } = item
    this.collectionCache.get(docType)?.[method](item).catch((err) => {
      this.errorsSubject.next({
        category,
        status: err.status,
        reason: err.message ?? err.reason,
      })
    })
  }

  private async handleCollectionSink (options: CollectionPayload<M, C, Category>) {
    const { category, docType, observableOptions } = options
    const col = await this.collection(docType, observableOptions as ICollectionRxOptions)

    // TODO: debug
    // col.removeAll().catch(() => {})
    this.collectionCache.set(docType, col)
    this.categorySubject.next(category)

    col.docs$.subscribe((docs) => {
      this.docsSubject.next({
        category,
        docs,
        docType,
      })
    })
  }

  private async collection<K extends keyof M & string> (docType: K, observableOptions: ICollectionRxOptions) {
    const col = this.db.collection(docType, observableOptions)
    col.extendComparator(this.comparatorMap)
    await col.enableLiveDocs().catch((err) => { console.error(err) })
    return col
  }
}

export { Database }
