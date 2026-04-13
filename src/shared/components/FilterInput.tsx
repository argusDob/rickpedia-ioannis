import { memo, useCallback, type ChangeEvent } from 'react'

type FilterInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder = 'Type to filter',
}: FilterInputProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value)
    },
    [onChange],
  )

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
        placeholder={placeholder}
      />
    </label>
  )
}

export default memo(FilterInput)
