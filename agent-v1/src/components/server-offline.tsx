import { AlertCircle, WifiOff } from 'lucide-react'

type ServerOfflineProps = {
  onRefresh?: () => void
}

export default function ServerOffline({ onRefresh }: ServerOfflineProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <WifiOff className="h-10 w-10 text-red-500" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-red-500">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Server is taking too long to respond
        </h1>

        <p className="mb-6 leading-relaxed text-slate-600">
          Please refresh the page or try again later.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full rounded-lg bg-slate-100 px-6 py-3 font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200"
          >
            {onRefresh ? 'Try again' : 'Refresh'}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            If the problem persists, please contact support or try again later.
          </p>
        </div>
      </div>
    </div>
  )
}
