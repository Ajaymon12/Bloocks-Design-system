import { createContext } from 'react'
import type { CheckboxSize } from './Checkbox'

export type CheckboxGroupContextValue = {
  size?: CheckboxSize
  isDisabled?: boolean
  /** Currently checked values across the whole group. */
  values: string[]
  /** Toggles a single value in/out of `values` and reports the updated array upward. */
  toggleValue: (value: string, checked: boolean) => void
}

// Lives here (co-located with Checkbox) rather than in CheckboxGroup/, so Checkbox never has to
// depend on the CheckboxGroup directory — CheckboxGroup imports and provides this instead. Same
// pattern as Button/ButtonGroupContext.ts.
export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | undefined>(undefined)
