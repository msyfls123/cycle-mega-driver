import path from 'path'

import { swc } from 'rollup-plugin-swc3'

import commonjs from '@rollup/plugin-commonjs'
import html from '@rollup/plugin-html'
import inject from '@rollup/plugin-inject'
import { nodeResolve } from '@rollup/plugin-node-resolve'

import { distDir, srcDir } from './constants.mjs'
import rendererConfig from './src/entry.js'

const { RENDERER_ENTRY } = rendererConfig

// const isProduction = process.env.NODE_ENV === 'production'

const plugins = [
  nodeResolve({
    preferBuiltins: true
  }),
  commonjs(),
  swc({
    jsc: {
      parser: {
        syntax: 'typescript'
      },
      minify: {
        sourceMap: true
      },
      target: 'es5'
    },
    sourceMaps: true
  })
]

const main = {
  input: path.join(srcDir, 'main.ts'),
  output: {
    dir: distDir,
    format: 'cjs',
    globals: {
      electron: 'require("electron")'
    },
    sourcemap: 'inline'
  },
  external: [
    'electron'
  ],
  plugins
}

const preload = {
  input: path.join(srcDir, 'preload.ts'),
  output: {
    dir: distDir,
    format: 'iife',
    globals: {
      electron: 'require("electron")'
    },
    sourcemap: 'inline'
  },
  external: [
    'electron'
  ],
  plugins
}

const rendererConfigs = Object.values(RENDERER_ENTRY).map(value => ({
  name: value,
  jsPath: path.join(srcDir, `renderer/${value}.tsx`)
}))

const createRenderer = ({ name, jsPath }) => ({
  input: jsPath,
  output: {
    dir: distDir,
    format: 'iife',
    sourcemap: 'inline'
  },
  plugins: [
    ...plugins,
    html({
      fileName: `${name}.html`,
      title: name,
    }),
    inject({
      Snabbdom: ['snabbdom-pragma', '*']
    })
  ]
})

const renderer = rendererConfigs.map(createRenderer)

export default [main, preload, ...renderer]
