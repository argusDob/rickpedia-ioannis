type SuspenseFallbackProps = {
  message: string
}

export default function SuspenseFallback({ message }: SuspenseFallbackProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white/70 p-6">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
        aria-hidden="true"
      />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  )
}
