type ErrorStateProps = {
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  actionLabel,
  onAction,
  compact = false,
}: ErrorStateProps) {
  const containerClasses = compact
    ? 'rounded-md border border-red-200 bg-red-50 p-3'
    : 'rounded-lg border border-red-200 bg-red-50 p-6'
  const titleClasses = compact
    ? 'text-sm font-semibold text-red-800'
    : 'text-base font-semibold text-red-800'

  return (
    <div role="alert" className={containerClasses}>
      <h2 className={titleClasses}>{title}</h2>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 inline-flex rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
