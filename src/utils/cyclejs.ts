export function isAutoScope (scope: any) {
  if (typeof scope === 'string') {
    return scope.startsWith('cycle')
  }
  return false
}
