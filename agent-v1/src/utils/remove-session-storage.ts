export function removeStorage(storageName: string) {
  sessionStorage.removeItem(storageName)
}

export function removeLocalStorage(storageName: string) {
  localStorage.removeItem(storageName)
}
