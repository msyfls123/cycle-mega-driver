import { DocType, Model } from './db'

export interface DatabaseDocsSource<M extends Model, Category extends string, K extends DocType<M>> {
  category: Category
  docType: K
  docs: Array<M[K]>
}

export type DocsSources<M extends Model, Category extends string> = {
  [K in DocType<M>]: DatabaseDocsSource<M, Category, K>
}

export interface ErrorSource<Category extends string> {
  category: Category
  reason: string
  status: number
}
