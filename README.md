# @cycle-mega-driver

Let main-process listen to renderer, renderer listen to main-process, Electron listen to you.

## Electron

```shell
npm i @cycle-mega-driver/electron electron @cycle/rxjs-run -D
```

Firstly, You should `import '@cycle-mega-driver/electron/dist/preload'` in your preload script.

then use `@cycle-mega-driver/electron/lib/main` and `@cycle-mega-driver/electron/lib/renderer` in your code.

[More details](./blob/main/packages/electron/README.md)

## Database
```shell
npm i @cycle-mega-driver/database @cycle/rxjs-run -D
```
[More details](./blob/main/packages/database/README.md)
## Known Issues

- Fix typescript@~4.7
  https://github.com/parcel-bundler/parcel/issues/8419
