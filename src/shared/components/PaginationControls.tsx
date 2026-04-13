import { memo } from 'react'

type PaginationControlsProps = {
  page: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  onPrev: () => void
  onNext: () => void
}

function PaginationControls({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrevPage}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <p className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNextPage}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}

export default memo(PaginationControls)
