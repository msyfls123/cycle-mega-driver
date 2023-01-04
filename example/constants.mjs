import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const exampleDir = __dirname
export const projectDir = path.join(__dirname, '..')
export const srcDir = path.join(__dirname, 'src')
export const distDir = path.join(__dirname, 'dist')
