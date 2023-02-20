import pouchLevelDB from 'pouchdb-adapter-leveldb'
import RxPouch from 'rx-pouch'
import type RxPouchDatabase from 'rx-pouch/dist/Db'

RxPouch.plugin(pouchLevelDB)

export function getDatabase (name: string): RxPouchDatabase {
  const db = new RxPouch(name) as RxPouchDatabase
  db.changes().change$.subscribe((data) => {
    console.log('changes', data)
  })
  return db
}
