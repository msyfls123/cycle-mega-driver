import path from 'path'
import { pathToFileURL } from 'url'

import { Category } from '../constants'
import { RENDERER_ENTRY } from '../entry'

const rendererFilePaths =
  Object.entries(RENDERER_ENTRY).reduce<typeof RENDERER_ENTRY>((acc, [key, value]) => ({
    ...acc,
    [key]: pathToFileURL(path.join(__dirname, `${value}.html`)).href
  }), {} as any)

export const CATEGORY_RENDERER_MAP = {
  [Category.Mainland]: rendererFilePaths.mainland,
}
