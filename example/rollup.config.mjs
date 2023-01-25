import path from 'path'

import { swc } from 'rollup-plugin-swc3'

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

import { distDir, srcDir } from './constants.mjs'

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

export default [main, preload]
