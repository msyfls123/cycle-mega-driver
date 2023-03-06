import 'bootstrap/dist/css/bootstrap.min.css'

import { combineLatest, filter, map, merge, startWith, withLatestFrom } from 'rxjs'

import { setup } from '@cycle/rxjs-run'

import { DatabaseCategory, User } from '../constants'
import { setupAdapt } from '../utils/adapt'
import { MatchRendererMain, RENDERER_DRIVERS } from './driver'

const main: MatchRendererMain<{
  SourceKeys: 'ipc' | 'dom'
  SinkKeys: 'ipc' | 'dom'
}> = ({ ipc, dom }) => {
  const domSink$ = combineLatest([
    ipc.select('user-list').pipe(startWith([] as User[]))
  ]).pipe(map(([users]) => (
    <div className="container">
      <form>
        <div className="form-group mb-3">
          <label>Name</label>
          <input type="text" name="name-input" placeholder="Your name" required className="form-control"/>
        </div>
        <div className="form-group mb-3">
          <label>Age</label>
          <input type="number" name="age" placeholder="Your age" required className="form-control"/>
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Submit</button>
      </form>
      <div className="row justify-content-center"><div className="col col-md-auto">
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Age</th>
              <th scope="col">Revision</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(({ name, age, _rev, _id }, index) => (
              <tr>
                <th scope="row">{index + 1}</th>
                <td>{name}</td>
                <td>{age}</td>
                <td>{_rev}</td>
                <td>
                  <button className="btn btn-danger btn-remove btn-sm" data-id={_id}>&nbsp;×&nbsp;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
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

  const create$ = dom.select('form').events('submit').pipe(
    map(e => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      return ipc.createSink(
        'manipulate-document',
        {
          key: 'create',
          value: {
            category: DatabaseCategory.Document,
            docType: 'user',
            doc: {
              _id: form['name-input'].value,
              name: form['name-input'].value,
              age: form.age.value,
              type: 'user',
            },
          }
        }
      )
    })
  )

  return {
    ipc: merge(
      delete$,
      create$,
    ),
    dom: domSink$,
  }
}

setupAdapt()
const program = setup(main, RENDERER_DRIVERS)
program.run()
