interface Option {
  value: string
  label: string
}

interface CheckboxGroupProps {
  name: string
  options: Option[]
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
}

export function CheckboxGroup({ name, options, values, onChange, disabled }: CheckboxGroupProps) {
  function toggle(val: string) {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            values.includes(opt.value)
              ? 'border-ninma-purple bg-ninma-purple-light'
              : 'border-gray-100 bg-gray-50 hover:border-ninma-purple/40'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            name={`${name}-${opt.value}`}
            checked={values.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            disabled={disabled}
            className="w-4 h-4 text-ninma-purple focus:ring-ninma-purple border-gray-300 rounded"
          />
          <span className="text-sm text-ninma-dark">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
