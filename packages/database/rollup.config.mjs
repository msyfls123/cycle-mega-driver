import path from 'path'
import { fileURLToPath } from 'url'

import autoExternal from 'rollup-plugin-auto-external'
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

const isProduction = process.env.NODE_ENV === 'production'

const commonConfig = {
  output: [
    ...(isProduction ? [{
      dir: distDir,
      format: 'cjs',
    }] : []),
    {
      dir: libDir,
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: srcDir,
    }
  ],
}

const plugins = [
  autoExternal({
    packagePath: path.join(__dirname, 'package.json'),
  }),
  nodeResolve({
    preferBuiltins: true,
  }),
  commonjs(),
  typescript({
    useTsconfigDeclarationDir: true,
    typescript: ttypescript,
    tsconfig: path.join(__dirname, 'tsconfig.json'),
    tsconfigDefaults: {
      compilerOptions: {
        emitDeclarationOnly: true,
      }
    }
  }),
  swc({
    jsc: {
      baseUrl: __dirname,
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
    index: path.join(srcDir, 'index.ts'),
  },
  plugins: [
    ...plugins,
  ],
}

export default main
