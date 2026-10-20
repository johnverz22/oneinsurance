import { create } from 'zustand'

interface PopupConfig {
  id: number
  title: string
  description: string
  note?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: 'success' | 'error'
}

type ShowPopupParams = Omit<PopupConfig, 'id'>

interface PopupStore {
  popups: PopupConfig[]
  showPopup: (params: ShowPopupParams) => number
  closePopup: (id: number) => void
}

export const usePopupStore = create<PopupStore>((set) => ({
  popups: [],

  showPopup: (params) => {
    const id = Date.now() + Math.random()
    const popup: PopupConfig = {
      id,
      title: params.title,
      description: params.description,
      note: params.note || '',
      confirmText: params.confirmText || 'OK',
      cancelText: params.cancelText,
      onConfirm: params.onConfirm,
      onCancel: params.onCancel,
      variant: params.variant || 'success',
    }

    set((state) => ({ popups: [...state.popups, popup] }))
    return id
  },

  closePopup: (id) => {
    set((state) => ({ popups: state.popups.filter((d) => d.id !== id) }))
  },
}))

export const popup = {
  show: (params: ShowPopupParams) => usePopupStore.getState().showPopup(params),
  close: (id: number) => usePopupStore.getState().closePopup(id),
}
