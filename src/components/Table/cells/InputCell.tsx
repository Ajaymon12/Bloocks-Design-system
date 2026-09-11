import type { ChangeEvent } from 'react'

export type InputCellProps = {
  accessibilityLabel: string
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

// A native <input> filling the entire cell — see DropdownCell's comment for why this isn't a
// wrapped TextInput: that carries its own visible border/shadow/rounded box, reading as a field
// floating *inside* the cell rather than the cell itself being the field. Pair with
// `meta: { fillCell: true }` on the column def so the wrapping <td> contributes no padding of its
// own; this component's own px/py reproduce the standard cell padding so text still lines up
// with plain-text cells in the same row, while w-full/h-full keeps the whole cell clickable.
export function InputCell({ accessibilityLabel, ...props }: InputCellProps) {
  return (
    <input
      type="text"
      aria-label={accessibilityLabel}
      className="w-full h-full bg-transparent border-0 outline-none px-[var(--space-12)] py-[var(--space-8)] text-inherit font-[family-name:var(--font-family-primary)]"
      {...props}
    />
  )
}
