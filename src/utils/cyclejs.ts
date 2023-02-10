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
  [K in keyof D]?: Observable<GetValidInputs<D[K]>>
}

export type CustomMain<D extends Drivers> =
  (sources: Sources<D>) => CustomSinks<D>

export type PickComponent<D extends Drivers, T extends keyof D> =
  (sources: Pick<Sources<D>, T>) => Pick<CustomSinks<D>, T>

export const pickDrivers = <D extends Drivers, T extends keyof D>(drivers: D, keys: T[]) => pick(drivers, keys)
