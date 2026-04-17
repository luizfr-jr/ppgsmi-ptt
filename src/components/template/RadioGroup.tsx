interface Option {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  name: string
  options: Option[]
  value: string | null | undefined
  onChange: (value: string) => void
  disabled?: boolean
}

export function RadioGroup({ name, options, value, onChange, disabled }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            value === opt.value
              ? 'border-ninma-teal bg-ninma-teal-light'
              : 'border-gray-100 bg-gray-50 hover:border-ninma-teal/40'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
            className="radio-input mt-0.5"
          />
          <div>
            <span className="text-sm font-medium text-ninma-dark">{opt.label}</span>
            {opt.description && (
              <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
