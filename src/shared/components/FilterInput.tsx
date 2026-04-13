type FilterInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function FilterInput({
  label,
  value,
  onChange,
  placeholder = 'Type to filter',
}: FilterInputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder={placeholder}
      />
    </label>
  )
}
