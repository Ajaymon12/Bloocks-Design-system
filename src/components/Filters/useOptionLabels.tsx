import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { asListValue } from './filterModel'
import type { FilterField, FilterOption, FilterValues } from './types'

// Filter values are option ids, but chips and the "Selected" group need labels — including for ids
// that aren't in the current search results (a restored filter, a ledger picked three searches ago).
// One cache per filter bar holds every label seen: enum options, entity_ref search results, and
// `resolveOptions` answers for anything still unknown. Panels opened from the bar share it through
// context, so a label learned inside a popover is immediately available to the chip that opened it.

export type FilterLabels = {
  getOption: (fieldKey: string, value: string) => FilterOption | undefined
  getLabel: (fieldKey: string, value: string) => string | undefined
  /** Records options seen for a field. Safe to call from async callbacks and effects. */
  remember: (fieldKey: string, options: FilterOption[]) => void
}

const FilterLabelsContext = createContext<FilterLabels | null>(null)

function useFilterLabelCache(fields: FilterField[], values: FilterValues, { resolve }: { resolve: boolean }): FilterLabels {
  const store = useRef(new Map<string, Map<string, FilterOption>>())
  const [version, setVersion] = useState(0)

  const write = useCallback((fieldKey: string, options: FilterOption[]) => {
    let bucket = store.current.get(fieldKey)
    if (!bucket) {
      bucket = new Map()
      store.current.set(fieldKey, bucket)
    }
    let changed = false
    for (const option of options) {
      const known = bucket.get(option.value)
      if (!known || known.label !== option.label || known.color !== option.color) {
        bucket.set(option.value, option)
        changed = true
      }
    }
    return changed
  }, [])

  // Static labels are known up front. Seeding them while rendering is idempotent and needs no
  // re-render, so the very first paint of a chip already has its label.
  for (const field of fields) {
    if (field.type === 'enum') write(field.key, field.options)
    else if (field.type === 'entity_ref' && field.initialOptions) write(field.key, field.initialOptions)
  }

  const remember = useCallback(
    (fieldKey: string, options: FilterOption[]) => {
      if (write(fieldKey, options)) setVersion((current) => current + 1)
    },
    [write],
  )

  const missingSignature = resolve
    ? fields
        .map((field) =>
          field.type === 'entity_ref' && field.resolveOptions
            ? `${field.key}=${asListValue(values[field.key])
                .filter((entry) => !store.current.get(field.key)?.has(entry))
                .join(',')}`
            : '',
        )
        .join('|')
    : ''

  useEffect(() => {
    if (!resolve) return undefined
    const controller = new AbortController()
    for (const field of fields) {
      if (field.type !== 'entity_ref' || !field.resolveOptions) continue
      const missing = asListValue(values[field.key]).filter((entry) => !store.current.get(field.key)?.has(entry))
      if (missing.length === 0) continue
      field.resolveOptions(missing, { signal: controller.signal }).then(
        (options) => {
          if (!controller.signal.aborted) remember(field.key, options)
        },
        // Unresolvable ids fall back to showing the id itself; nothing else to do.
        () => {},
      )
    }
    return () => controller.abort()
    // Keyed on what's actually missing, not on `fields`/`values` identity — callers often pass fresh
    // objects every render, and re-resolving on each would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingSignature])

  return useMemo<FilterLabels>(
    () => ({
      getOption: (fieldKey, value) => store.current.get(fieldKey)?.get(value),
      getLabel: (fieldKey, value) => store.current.get(fieldKey)?.get(value)?.label,
      remember,
    }),
    // `version` is the signal that the mutable store gained labels; consumers re-render on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [remember, version],
  )
}

/** Provides a label cache — or passes through the nearest existing one, so a panel inside a
 * FilterBar shares the bar's cache while the same panel rendered alone still works. */
export function FilterLabelsProvider({
  fields,
  values,
  children,
}: {
  fields: FilterField[]
  values: FilterValues
  children: ReactNode
}) {
  const parent = useContext(FilterLabelsContext)
  const local = useFilterLabelCache(fields, values, { resolve: parent === null })
  return <FilterLabelsContext.Provider value={parent ?? local}>{children}</FilterLabelsContext.Provider>
}

export function useFilterLabels(): FilterLabels {
  const labels = useContext(FilterLabelsContext)
  if (!labels) throw new Error('useFilterLabels must be used inside a FilterLabelsProvider')
  return labels
}
