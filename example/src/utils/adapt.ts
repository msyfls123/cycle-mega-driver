import { xsToObservable } from '@cycle-mega-driver/common/lib'
import { setAdapt } from '@cycle/run/lib/adapt'

export function setupAdapt () {
  setAdapt((xs$) => {
    if (typeof xs$.addListener === 'function') return xsToObservable(xs$)
    return xs$
  })
}
