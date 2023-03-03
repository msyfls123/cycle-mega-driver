import { NEVER, of } from 'rxjs'

import run from '@cycle/rxjs-run'

import { MatchRendererMain, RENDERER_DRIVERS } from './driver'

const main: MatchRendererMain<{
  SourceKeys: 'ipc' | 'dom'
  SinkKeys: 'ipc' | 'dom'
}> = ({ ipc, dom }) => {
  const domSink$ = of((
    <div>
      <p>
        <input type="number" className="age" placeholder="Age"/>
        <button>Confirm</button>
      </p>
    </div>
  ))
  return {
    ipc: NEVER,
    dom: domSink$,
  }
}

run(main, RENDERER_DRIVERS)
