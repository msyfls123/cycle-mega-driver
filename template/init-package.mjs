/**
 * yarn run init <package name>
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const scope = process.argv[2]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageDir = path.join(__dirname, '../packages', scope)

fs.promises.access(packageDir).then(async () => {
  const files = await fs.promises.readdir(packageDir)
  if (!files.includes('rollup.config.js')) {
    await fs.promises.copyFile(
      path.join(__dirname, 'rollup.config.mjs.tmpl'),
      path.join(packageDir, 'rollup.config.mjs'),
    )
  }
  if (!files.includes('.eslintrc.js')) {
    await fs.promises.copyFile(
      path.join(__dirname, '.eslintrc.js.tmpl'),
      path.join(packageDir, '.eslintrc.js'),
    )
  }
  if (!files.includes('tsconfig.json')) {
    await fs.promises.copyFile(
      path.join(__dirname, 'tsconfig.json.tmpl'),
      path.join(packageDir, 'tsconfig.json'),
    )
  }
  console.info(`✅ Init Package <@cycle-mega-driver/${scope}> Success!`)
})
  .catch((err) => {
    console.error('init package failed', err)
  })
