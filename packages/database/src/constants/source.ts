import { Category, DocType, Model } from './db'

export interface DatabaseDocsSource<M extends Model, Cat extends Category<M>, K extends keyof Cat> {
  category: K
  docType: Cat[K]
  docs: Array<M[Cat[K]]>
}

export type DocsSources<M extends Model, Cat extends Category<M>> = {
  [K in DocType<M>]: DatabaseDocsSource<M, Cat, K>
}

export interface ErrorSource<Category extends string> {
  category: Category
  reason: string
  status: number
}
