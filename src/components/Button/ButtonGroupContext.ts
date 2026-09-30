import { createContext } from 'react'
import type { ButtonSize, ButtonVariant } from './Button'

export type ButtonGroupContextValue = {
  variant?: ButtonVariant
  size?: ButtonSize
  isDisabled?: boolean
  isFullWidth?: boolean
  orientation?: 'horizontal' | 'vertical'
}

// Lives here (co-located with Button) rather than in ButtonGroup/, so Button never has to
// depend on the ButtonGroup directory — ButtonGroup imports and provides this instead.
export const ButtonGroupContext = createContext<ButtonGroupContextValue | undefined>(undefined)
