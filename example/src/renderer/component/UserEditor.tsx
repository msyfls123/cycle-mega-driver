import { isNil } from 'lodash'
import { Observable, map, withLatestFrom } from 'rxjs'

import { DatabaseCategory, User } from '../../constants'
import { MatchRendererMain } from '../driver'

export const UserEditor: MatchRendererMain<{
  SourceKeys: 'dom' | 'ipc'
  SinkKeys: 'dom' | 'ipc'
  ExtraSources: { user: Observable<User | undefined> }
}> = ({ user, dom, ipc }) => {
  const dom$ = user.pipe(map((user) => <form>
    <tr className="row-user" data-id={user?._id}>
      <th scope="row">{isNil(user) ? 'Add' : 'Edit' }</th>
      <td><input type="text" name="name-input" placeholder="Your name" defaultValue={user?.name} required /></td>
      <td><input type="number" name="age" placeholder="Your age" required defaultValue={user?.age}/></td>
      <td>{user?._rev}</td>
      <td>
        <button className="btn btn-primary btn-sm">Confirm</button>
      </td>
    </tr>
  </form>))

  const upsert$ = dom.select('form').events('submit').pipe(
    withLatestFrom(user),
    map(([e, user]) => {
      e.preventDefault()
      const form = e.target as HTMLFormElement
      if (isNil(user)) {
        const sink = ipc.createSink(
          'manipulate-document',
          {
            key: 'create',
            value: {
              category: DatabaseCategory.Document,
              docType: 'user',
              doc: {
                _id: form['name-input'].value,
                name: form['name-input'].value,
                age: Number(form.age.value),
                type: 'user',
              },
            }
          }
        )
        form['name-input'].value = ''
        form.age.value = ''
        return sink
      }
      return ipc.createSink(
        'manipulate-document',
        {
          key: 'update',
          value: {
            category: DatabaseCategory.Document,
            docType: 'user',
            doc: {
              ...user,
              name: form['name-input'].value,
              age: Number(form.age.value),
              type: 'user',
            },
          }
        }
      )
    })
  )

  return {
    dom: dom$,
    ipc: upsert$,
  }
}
