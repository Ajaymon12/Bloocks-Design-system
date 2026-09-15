import { useState } from 'react'
import { PanelSearch } from '@/components/ui/panel-search'
import { toggleValue } from '../filterModel'
import type { EnumFilterField } from '../types'
import { NoMatches } from './FieldMessages'
import { OptionChecklist } from './OptionChecklist'

export type EnumFieldBodyProps = {
  field: EnumFilterField
  value: string[]
  onChange: (next: string[]) => void
  autoFocus?: boolean
}

/** A fixed option set as a checklist. Search only appears past `searchThreshold` options (spec §6.1:
 * "searchable if > 8") — a short list is faster to scan than to type into. */
export function EnumFieldBody({ field, value, onChange, autoFocus = false }: EnumFieldBodyProps) {
  const [query, setQuery] = useState('')
  const isSearchable = field.options.length > (field.searchThreshold ?? 8)
  const trimmed = query.trim().toLowerCase()
  const visible = trimmed ? field.options.filter((option) => option.label.toLowerCase().includes(trimmed)) : field.options

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isSearchable && (
        <PanelSearch
          value={query}
          onChange={setQuery}
          placeholder={`Search ${field.label.toLowerCase()}`}
          className="px-[var(--space-16)] py-[var(--space-8)]"
          inputProps={{ 'aria-label': `Search ${field.label}`, autoFocus }}
        />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-8)] py-[var(--space-4)]">
        {visible.length === 0 ? (
          <NoMatches query={query} />
        ) : (
          <OptionChecklist
            options={visible}
            selected={value}
            onToggle={(option) => onChange(toggleValue(value, option))}
            accessibilityLabel={field.label}
          />
        )}
      </div>
    </div>
  )
}
