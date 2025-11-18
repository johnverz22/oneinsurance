'use client'

import { usePopupStore } from '@/store/use-popup-store'
import { Check, X } from 'lucide-react'

const SuccessIcon: React.FC = () => (
  <div className="relative mx-auto mb-6 h-32 w-32 rounded-full bg-emerald-50 p-6">
    <Check className="text-primary h-full w-full" />
  </div>
)

const ErrorIcon: React.FC = () => (
  <div className="relative mx-auto mb-6 h-32 w-32 rounded-full bg-rose-50 p-6">
    <X className="text-destructive h-full w-full" />
  </div>
)

export const AppPopup: React.FC = () => {
  const { popups, closePopup } = usePopupStore()

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      {popups.map((item) => (
        <div
          key={item.id}
          className="animate-in fade-in pointer-events-auto fixed inset-0 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm duration-200"
        >
          <div className="bg-background animate-in zoom-in-95 w-full max-w-md rounded-3xl p-8 shadow-2xl duration-200">
            {item.variant === 'success' ? <SuccessIcon /> : <ErrorIcon />}

            <h2 className="text-foreground mb-3 text-center text-xl font-semibold md:text-2xl">
              {item.title}
            </h2>

            <p className="text-muted-foreground mb-8 text-center text-sm font-medium">
              {item.description}
            </p>

            {item.note && (
              <p className="text-muted-foreground mb-8 text-center text-sm font-medium">
                {item.note}
              </p>
            )}

            <div className="flex gap-3">
              {item.cancelText && (
                <button
                  onClick={() => {
                    item.onCancel?.()
                    closePopup(item.id)
                  }}
                  className={`flex-1 rounded-2xl px-6 py-4 text-lg font-semibold transition-all ${
                    item.variant === 'success'
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {item.cancelText}
                </button>
              )}

              <button
                onClick={() => {
                  item.onConfirm?.()
                  closePopup(item.id)
                }}
                className={`flex-1 rounded-2xl px-6 py-4 text-lg font-semibold transition-all ${
                  item.variant === 'success'
                    ? 'from-primary to-primary/80 hover:from-primary/80 hover:to-primary bg-gradient-to-r text-white'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {item.confirmText}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
