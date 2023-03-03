export interface IPCMainConfig {
  visible: string
  test: boolean // nothing to do
}

export interface IPCRendererConfig {
  'toggle-focus': boolean
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

export enum Category {
  Mainland = 'mainland',
  DBViewer = 'db-viewer'
}
