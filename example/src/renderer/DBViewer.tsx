import 'bootstrap/dist/css/bootstrap.min.css'

import { Observable, combineLatest, filter, map, merge, of, share, startWith, withLatestFrom } from 'rxjs'

import { Reducer, StateSource, setupAdapt, withState } from '@cycle-mega-driver/common/lib'
import isolate from '@cycle/isolate'
import { setup } from '@cycle/rxjs-run'

import { DatabaseCategory, User } from '../constants'
import { UserEditor } from './component/UserEditor'
import { MatchRendererMain, RENDERER_DRIVERS } from './driver'

interface State {
  userId?: string
}

const main: MatchRendererMain<{
  SourceKeys: 'ipc' | 'dom'
  SinkKeys: 'ipc' | 'dom'
  ExtraSources: { state: StateSource<State> }
  ExtraSinks: { state: Observable<Reducer<State>> }
}> = ({ ipc, dom, state }) => {
  const sharedUserList = ipc.select('user-list').pipe(
    startWith([] as User[]),
    share(),
  )

  const initialState$ = of(() => ({}))
  const reducer1$ = dom.select('.row-user').events('click').pipe(
    filter(evt => !['input', 'button'].includes((evt.target as HTMLInputElement).tagName.toLowerCase())),
    map(evt => (evt.currentTarget as HTMLElement).dataset.id),
    map((id) => (state: State) => ({
      ...state,
      userId: id === state.userId ? undefined : id,
    })),
  )
  const reducer2$ = sharedUserList.pipe(map(() => (state: State) => ({
    ...state,
    userId: undefined,
  })))

  const selectUser$ = state.observable.pipe(
    withLatestFrom(sharedUserList),
    map(([{ userId }, users]) => users.find(user => user._id === userId)),
    startWith(undefined),
  )
  const { dom: addForm$, ipc: addIpc$ } = isolate(UserEditor)({ dom, ipc, user: of(undefined) })

  const { dom: editForm$, ipc: editIpc$ } = UserEditor({
    dom,
    ipc,
    user: selectUser$,
  })

  const domSink$ = combineLatest([
    sharedUserList,
    state.observable,
    addForm$,
    editForm$,
  ]).pipe(map(([users, state, addForm, editForm]) => (
    <div className="container">
      {addForm}
      <div className="row justify-content-center"><div className="col col-md-auto">
        <div className="table table-striped">
          <header>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Age</th>
              <th scope="col">Revision</th>
              <th scope="col">Action</th>
            </tr>
          </header>
          <article>
            {users.map(({ name, age, _rev, _id }, index: number) => (
              _id === state.userId ? editForm : (
                <tr className="row-user" data-id={_id}>
                  <th scope="row">{index + 1}</th>
                  <td>{name}</td>
                  <td>{age}</td>
                  <td>{_rev}</td>
                  <td>
                    <button className="btn btn-danger btn-remove btn-sm" data-id={_id}>&nbsp;×&nbsp;</button>
                  </td>
                </tr>
              )
            ))}
          </article>
        </div>
      </div></div>
      <p>Clicked: {state.userId}</p>
    </div>
  )))

  const delete$ = dom.select('.btn-remove').events('click').pipe(
    withLatestFrom(ipc.select('user-list')),
    map(([evt, users]) => {
      const foundUser = users.find(({ _id }) => _id === (evt.target as HTMLElement).dataset.id)
      if (!foundUser) return
      return ipc.createSink(
        'manipulate-document',
        {
          key: 'remove',
          value: {
            category: DatabaseCategory.Document,
            docType: 'user',
            doc: foundUser,
          }
        }
      )
    }),
    filter(Boolean)
  )

  return {
    ipc: merge(
      delete$,
      addIpc$,
      editIpc$,
    ),
    dom: domSink$,
    state: merge(initialState$, reducer1$, reducer2$),
  }
}

setupAdapt()
const program = setup(withState(main), RENDERER_DRIVERS)
program.run()
