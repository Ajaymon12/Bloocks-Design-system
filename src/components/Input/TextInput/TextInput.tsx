import { forwardRef } from 'react'
import { BaseInput } from '../BaseInput/BaseInput'
import type { BaseInputProps } from '../BaseInput/BaseInput'

export type TextInputProps = Omit<BaseInputProps, 'as' | 'rows' | 'type'> & {
  /** Use `PasswordInput` instead of `type="password"` here. */
  type?: Exclude<BaseInputProps['type'], 'password'>
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
  return <BaseInput {...props} as="input" ref={ref} />
})

TextInput.displayName = 'TextInput'
