import { swc } from 'rollup-plugin-swc3'
import typescript from 'rollup-plugin-typescript2'

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'

const commonConfig = {
  output: [
    {
      dir: 'dist',
      format: 'cjs',
      globals: {
          electron: 'require("electron")',
      },
    },
    {
      dir: 'lib',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
      globals: {
          electron: 'require("electron")',
      },
    }
  ],
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
    useTsconfigDeclarationDir: true
  }),
  swc({
    jsc: {
      parser: {
        syntax: 'typescript',
      },
      target: 'es5',
    },
  }),
]

const main = {
  ...commonConfig,

  input: {
    main: 'src/main/index.ts',
    renderer: 'src/renderer/index.ts',
  },
  plugins: [
    ...plugins,
  ],
}

export default [main]
