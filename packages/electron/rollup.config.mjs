import path from 'path'
import { fileURLToPath } from 'url'

import { swc } from 'rollup-plugin-swc3'
import typescript from 'rollup-plugin-typescript2'
import ttypescript from 'ttypescript'

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const srcDir = path.join(__dirname, 'src')
const distDir = path.join(__dirname, 'dist')
const libDir = path.join(__dirname, 'lib')

const commonConfig = {
  output: [
    {
      dir: distDir,
      format: 'cjs',
      globals: {
        electron: 'require("electron")',
      },
    },
    {
      dir: libDir,
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: srcDir,
      hoistTransitiveImports: false,
      globals: {
        electron: 'require("electron")',
      },
    }
  ],
  external: [
    'electron',
  ],
}

const preloadConfig = {
  output: {
    name: 'MEGA_PRELOAD',
    dir: distDir,
    format: 'iife',
    globals: {
      electron: 'require("electron")',
    },
  },
  external: [
    'electron',
  ],
}

const plugins = [
  nodeResolve({
    preferBuiltins: true,
  }),
  commonjs(),
  typescript({
    // check: false,
    useTsconfigDeclarationDir: true,
    typescript: ttypescript,
    tsconfig: path.join(__dirname, 'tsconfig.json'),
    tsconfigDefaults: {
      compilerOptions: {
        // rootDir: srcDir,
        plugins: [
          { transform: 'typescript-transform-paths' },
          { transform: 'typescript-transform-paths', afterDeclarations: true }
        ]
      }
    }
  }),
  swc({
    jsc: {
      baseUrl: __dirname,
      parser: {
        syntax: 'typescript',
      },
      target: 'es2018',
    },
  }),
]

const main = {
  ...commonConfig,
  input: {
    main: path.join(srcDir, 'main/index.ts'),
    renderer: path.join(srcDir, 'renderer/index.ts'),
    common: path.join(srcDir, 'common.ts'),
  },
  plugins: [
    ...plugins,
  ],
}

const preload = {
  ...preloadConfig,
  input: {
    preload: path.join(srcDir, 'renderer/preload.ts'),
  },
  plugins: [
    ...plugins,
  ]
}

export default [main, preload]
