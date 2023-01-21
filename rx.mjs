import { ReplaySubject, Subject, connectable, merge, of, tap } from 'rxjs'

const sub = new Subject;

const sub1 = connectable(
    sub,
    {
        connector: () => new ReplaySubject(1),
        resetOnDisconnect: false,
    }
)

const sub2 = connectable(
    of(2).pipe(tap(console.log)),
    {
        connector: () => new ReplaySubject(1),
        resetOnDisconnect: false,
    }
)

sub1.connect()
sub2.connect()

sub.next(1)

const merged = merge(
    sub1,
    of(3)
)

merged.subscribe((data) => console.log('first sub', data))

console.log('333')

setTimeout(() => merge(merged, sub2).subscribe(console.log), 1000)
