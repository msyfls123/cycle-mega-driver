import pouchLevelDB from 'pouchdb-adapter-leveldb'
import RxPouch from 'rx-pouch'
import { Collection, ICollectionRxOptions } from 'rx-pouch/dist/Collection'
import type RxPouchDatabase from 'rx-pouch/dist/Db'
import { Connectable, Observable, ReplaySubject, Subject, connectable, filter, map, scan } from 'rxjs'

import { pickFromEntries } from '@cycle-mega-driver/common/lib'
import { Category, CategoryKey, ComparatorMap, Comparators, DocMethod, DocType, Model } from '@src/constants/db'
import { CollectionPayload, CreatePayload, DatabaseConfig, DatabaseSink, DocPayload, SetupPayload } from '@src/constants/sink'
import { DatabaseDocsSource, DocsSources, ErrorSource } from '@src/constants/source'

RxPouch.plugin(pouchLevelDB)

interface DatabaseCtorOptions<M extends Model, C extends Comparators, Cat extends Category<M>> {
  comparatorMap: ComparatorMap<C>
  sink$: Observable<DatabaseSink<M, C, Cat>>
}

export class DatabaseSource<M extends Model, C extends Comparators, Cat extends Category<M>> {
  select: <K extends CategoryKey<Cat>> (category: K) => Observable<DatabaseDocsSource<M, Cat, K>>

  createSink (key: 'setup', payload: SetupPayload): DatabaseSink<M, C, Cat>
  createSink<K extends CategoryKey<Cat>>(key: 'create', payload: CreatePayload<M, Cat, K>): DatabaseSink<M, C, Cat>
  createSink<K extends CategoryKey<Cat>>(key: 'update', payload: DocPayload<M, Cat, K>): DatabaseSink<M, C, Cat>
  createSink<K extends CategoryKey<Cat>>(key: 'remove', payload: DocPayload<M, Cat, K>): DatabaseSink<M, C, Cat>
  createSink<K extends CategoryKey<Cat>>(key: 'collection', payload: CollectionPayload<M, C, Cat, K>)
  createSink<K extends keyof DatabaseConfig<M, C, Cat>>(
    key: K,
    data: DatabaseConfig<M, C, Cat>[K]
  ): DatabaseSink<M, C, Cat> {
    return {
      key,
      value: data
    } as DatabaseSink<M, C, Cat>
  }

  waitCategoryRegistered: <K extends CategoryKey<Cat>> (category: K) => Observable<void>
  errors: <K extends CategoryKey<Cat>> (category: K) => Observable<ErrorSource<K>>
}

class Database<M extends Model, C extends Comparators, Cat extends Category<M>> implements Database<M, C, Cat> {
  private db: RxPouchDatabase
  private readonly comparatorMap: ComparatorMap<C>

  private readonly collectionCache = new Map<keyof M, Collection<M[keyof M]>>()

  private readonly docsSubject = new Subject<DocsSources<M, Cat>[DocType<M>]>()
  private readonly errorsSubject = new Subject<ErrorSource<CategoryKey<Cat>>>()
  private readonly categorySubject = new Subject<CategoryKey<Cat>>()
  private readonly categoryConn: Connectable<Set<CategoryKey<Cat>>>

  public constructor (options: DatabaseCtorOptions<M, C, Cat>) {
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
      this.categorySubject.pipe(scan((acc, val) => acc.add(val), new Set<CategoryKey<Cat>>())),
      { connector: () => new ReplaySubject(1) },
    )
    categoryConn.connect()
    this.categoryConn = categoryConn
  }

  public select<K extends CategoryKey<Cat>> (category: K) {
    return this.docsSubject.asObservable().pipe(
      filter(({ category: currCategory }) => currCategory === category)
    ) as Observable<DatabaseDocsSource<M, Cat, K>>
  }

  public errors<K extends CategoryKey<Cat>> (category: K) {
    return this.errorsSubject.asObservable().pipe(
      filter(({ category: currCategory }) => currCategory === category)
    ) as Observable<ErrorSource<K>>
  }

  public waitCategoryRegistered<K extends CategoryKey<Cat>> (category: K) {
    return this.categoryConn.pipe(
      filter((set) => set.has(category)),
      map(() => {})
    )
  }

  public createSink<K extends keyof DatabaseConfig<M, C, Cat>>(
    key: K,
    data: DatabaseConfig<M, C, Cat>[K]
  ): DatabaseSink<M, C, Cat> {
    return {
      key,
      value: data
    } as DatabaseSink<M, C, Cat>
  }

  private handleDocumentSink (sink$: Observable<DatabaseSink<M, C, Cat>>) {
    const create$ = sink$.pipe(pickFromEntries('create'))
    create$.subscribe(({ category, doc }) => {
      const item: M[Cat[CategoryKey<Cat>]] = { _id: 'test', ...doc } as M[Cat[CategoryKey<Cat>]]
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

  private manipulateDoc (category: CategoryKey<Cat>, item: M[keyof M], method: DocMethod) {
    const { type: docType } = item
    this.collectionCache.get(docType)?.[method](item).catch((err) => {
      this.errorsSubject.next({
        category,
        status: err.status,
        reason: err.message ?? err.reason,
      })
    })
  }

  private async handleCollectionSink (options: CollectionPayload<M, C, Cat>) {
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
