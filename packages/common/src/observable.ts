import { Observable, catchError, filter, from, map, merge, throwError } from 'rxjs'

export type Obj = Record<string, any>

/**
 * { a: string } => { a: Observable<string> }
 */
export type MapValueToObservable<T extends Obj> = {
  [K in keyof T]: Observable<T[K]>
}

export type IntoEntries<T extends Obj> = {
  [K in keyof T]: {
    key: K
    value: Required<T>[K]
  }
}[keyof T]

type Entries = IntoEntries<Obj>

/**
 * https://stackoverflow.com/a/65376116
 */
export type FromEntreis<I extends Entries> = { [T in I as T['key']]: T['value'] }

export const intoEntries = <T extends Obj>(input: MapValueToObservable<T>) => {
  return merge(
    ...(Object.entries(input)
      .map(
        ([key, stream]) => from(stream).pipe(
          map((value) => ({ key, value })),
          catchError((err) => throwError(() => ({
            key,
            err
          })))
        )
      )
    )
  ) as Observable<NonNullable<IntoEntries<T>>>
}

export function pickFromEntries<T extends Entries, K extends T['key']> (name: K) {
  return (source: Observable<T>) => source.pipe(
    filter(({ key }) => key === name),
    map(data => data.value),
  ) as Observable<FromEntreis<T>[K]>
}
