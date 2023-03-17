import { type Sources, type Drivers, type GetValidInputs } from '@cycle/run'
import { type Observable } from 'rxjs'
import pick from 'lodash/pick'

export function isAutoScope (scope: any) {
  if (typeof scope === 'string') {
    return scope.startsWith('cycle')
  }
  return false
}

export type CustomSinks<D extends Drivers> = {
  [K in keyof D]: Observable<GetValidInputs<D[K]>>
}

export type CustomMain<D extends Drivers> =
  (sources: Sources<D>) => CustomSinks<D>

export interface PickComponentOptions<D extends Drivers, R extends (any[] | undefined)> {
  SourceKeys: keyof D
  SinkKeys?: keyof D
  ExtraSources?: unknown
  ExtraSinks?: unknown
  RestArgs?: R
}

type ValueOrDefault<A, B extends string | any> = B extends string ? B : A
type EnsureArray<T> = T extends any[] ? T : []

export type PickComponent<
  D extends Drivers,
  R extends (any[] | undefined),
  options extends PickComponentOptions<D, R>,
> =
  (sources: Pick<Sources<D>, options['SourceKeys']> & options['ExtraSources'], ...rest: EnsureArray<options['RestArgs']>) =>
  Pick<
  CustomSinks<D>,
  ValueOrDefault<options['SourceKeys'], options['SinkKeys']>
  > & options['ExtraSinks']

export const pickDrivers = <D extends Drivers, T extends keyof D>(drivers: D, keys: T[]) => pick(drivers, keys)
