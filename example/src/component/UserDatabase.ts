import { Observable, asyncScheduler, delayWhen, map, merge, of } from 'rxjs'

import { DatabaseCategory } from '../constants'
import { MatchMain } from '../main/driver'

export const UserDatabase: MatchMain<{
  SourceKeys: 'database' | 'ipc'
  ExtraSources: { databaseSetup$: Observable<any> }
}> = ({ ipc, database, databaseSetup$ }) => {
  const collection$ = of(database.createSink('collection', {
    docType: 'user',
    category: DatabaseCategory.Collection,
    observableOptions: {
      filter: of(
        { age: 0 },
        asyncScheduler,
      ),
      filterType: of(({
        age: 'gt' as const,
      }))
    },
  })).pipe(delayWhen(() => databaseSetup$))

  const docs$ = database.select(DatabaseCategory.Collection, 'user').pipe(
    map(({ docs }) => ipc.createSink({
      'user-list': docs,
    }))
  )

  const manipulation$ = ipc.select('manipulate-document').pipe(map(({ data }) => {
    if (data.key === 'create') {
      return database.createSink('create', data.value)
    }
    if (data.key === 'remove') {
      return database.createSink('remove', data.value)
    }
    return database.createSink(data.key, data.value)
  }))

  return {
    database: merge(collection$, manipulation$),
    ipc: docs$
  }
}
