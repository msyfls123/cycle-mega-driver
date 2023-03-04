# @cycle-mega-driver

Let main-process listen to renderer, renderer listen to main-process, Electron listen to you.

## Electron

```shell
npm i @cycle-mega-driver/electron electron @cycle/rxjs-run -D
```

Firstly, You should `import '@cycle-mega-driver/electron/dist/preload'` in your preload script.

then use `@cycle-mega-driver/electron/lib/main` and `@cycle-mega-driver/electron/lib/renderer` in your code.

[More details](./packages/electron/README.md)

## Database
```shell
npm i @cycle-mega-driver/database @cycle/rxjs-run -D
```
[More details](./packages/database/README.md)
## Known Issues

- Fix typescript@~4.7
  https://github.com/parcel-bundler/parcel/issues/8419
- Lerna `patch-package` cannot patch `rx-pouch` in `packages/database`.  
  Have to place rx-pouch as devDependencies, so rollup can bundle it.
  But how about its dependencies?
  I have nothing to do but add [them](https://github.com/pablomaurer/RxPouch/blob/31f412a2ec4b8727b6977ef4d39afeee4c00ab8b/package.json#L52-L57) as dependencies:
  - "deep-array-filter": "^1.0.4",
  - "fast-sort": "^1.5.4",
  - "pouchdb-adapter-http": "^7.0.0",
  - "pouchdb-core": "^7.0.0",
  - "pouchdb-mapreduce": "^7.0.0",
  - "pouchdb-replication": "^7.0.0",
  
  Dirty, but works.
