import { swc } from 'rollup-plugin-swc3'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'lib',
      format: 'es',
    },
    {
      dir: 'dist',
      format: 'cjs',
    }
  ],
  plugins: [
    swc({
      jsc: {
        parser: {
          syntax: 'typescript',
        },
        target: 'es5',
      },
    }),
    typescript({
      useTsconfigDeclarationDir: true
    })
  ],
}
