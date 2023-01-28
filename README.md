# cycle-mega-driver

Let main-process listen to renderer, renderer listen to main-process, Electron listen to you.

## Setup

```shell
npm i cycle-mega-driver -D
```

Firstly, You should `import 'cycle-mega-driver/dist/preload'` in your preload script.

then use `cycle-mega-driver/lib/main` and `cycle-mega-driver/lib/renderer` in your code.
