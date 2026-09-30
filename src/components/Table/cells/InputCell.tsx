import type { ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { CELL_PADDING } from './cellVariants'

export type InputCellProps = {
  accessibilityLabel: string
  value?: string
  defaultValue?: string
  placeholder?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
  /** Gives the native `<input>` the real `disabled` attribute and dims the cell. */
  isDisabled?: boolean
  tooltip?: string
  className?: string
}

// A native <input> filling the entire cell — see DropdownCell's comment for why this isn't a
// wrapped TextInput: that carries its own visible border/shadow/rounded box, reading as a field
// floating *inside* the cell rather than the cell itself being the field. Pair with
// `meta: { fillCell: true }` on the column def so the wrapping <td> contributes no padding of its
// own; CELL_PADDING (cellVariants.ts) reproduces the standard cell padding here so text still
// lines up with plain-text cells in the same row, while w-full/h-full keeps the whole cell clickable.
export function InputCell({ accessibilityLabel, isDisabled, tooltip, className, ...props }: InputCellProps) {
  return (
    <input
      type="text"
      aria-label={accessibilityLabel}
      disabled={isDisabled}
      title={tooltip}
      className={cn(
        // no-inner-focus-ring: the ring is drawn on the whole cell instead (Table.tsx, fillCell), so
        // the control doesn't add a second, smaller one of its own.
        'no-inner-focus-ring w-full h-full bg-transparent border-0 outline-none text-inherit font-[family-name:var(--font-family-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        CELL_PADDING,
        className,
      )}
      {...props}
    />
  )
}
