// import { Model } from '@cycle-mega-driver/database/lib/constants/db'

import { IntoEntries } from '@cycle-mega-driver/common/lib'
import { Doc, DocumentConfig } from '@cycle-mega-driver/database/lib/constants'

export interface IPCMainConfig {
  visible: string
  'user-list': User[]
}

export interface IPCRendererConfig {
  'toggle-focus': boolean
  'manipulate-document': IntoEntries<DocumentConfig<DatabaseModel, 'user', DatabaseCategory>>
  language: string
}

export enum MenuId {
  Love = 'love',
  Quit = 'quit',
  EnableQuit = 'enable-quit',
  Tab1 = 'tab1',
  Tab2 = 'tab2',
  Tab3 = 'tab3',
  Tab4 = 'tab4',
  Tab5 = 'tab5',
  Tab6 = 'tab6',
  Tab7 = 'tab7',
  Tab8 = 'tab8',
  Tab9 = 'tab9',
}

export const TAB_MENU = [
  MenuId.Tab1,
  MenuId.Tab2,
  MenuId.Tab3,
  MenuId.Tab4,
  MenuId.Tab5,
  MenuId.Tab6,
  MenuId.Tab7,
  MenuId.Tab8,
  MenuId.Tab9
]

export interface User extends Doc {
  _id: string
  type: 'user'
  name: string
  age: number
}

interface Deposit {
  _id: string
  type: 'deposit'
  balance: number
  loan: number
  userId: string
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type DatabaseModel = {
  user: User
  deposit: Deposit
}

export enum DatabaseCategory {
  Collection = 'collection',
  Document = 'document',
}

export type DatabaseExtraComparators = unknown
export const COMPARATORS = {}

export enum Category {
  Mainland = 'mainland',
  DBViewer = 'db-viewer'
}
