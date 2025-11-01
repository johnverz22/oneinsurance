export function PageLoader() {
  return (
    <div className="animate-fade-in flex min-h-[60vh] w-full flex-col items-center justify-center">
      <svg
        className="text-primary mb-6 h-12 w-12 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <h2 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
        Loading, please wait...
      </h2>
      <p className="max-w-xs text-center text-sm text-gray-500 dark:text-gray-400">
        We’re preparing your experience. This may take a moment.
      </p>
    </div>
  )
}
