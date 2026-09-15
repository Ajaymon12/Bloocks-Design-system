import { useCallback, useMemo, useState } from 'react'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { compactFilterValues, isEmptyFilterValue } from './filterModel'
import type { FilterField, FilterValue, FilterValues } from './types'

// Bridges `FilterValues` (keyed by field) and TanStack's `ColumnFiltersState` (keyed by column), so a
// FilterBar can drive `<Table columnFilters onColumnFiltersChange>`. Columns opt in with
// `filterFn: 'anyOf'` (enum / entity_ref) or `filterFn: 'dateRange'` (date).

export function filterValuesToColumnFilters(fields: FilterField[], values: FilterValues): ColumnFiltersState {
  return fields.flatMap((field) => {
    const value = values[field.key]
    return isEmptyFilterValue(field, value) ? [] : [{ id: field.columnId ?? field.key, value }]
  })
}

/** The reverse, for filters set from inside the table (a column header's date filter). Filters on
 * columns no field describes come back as `unmapped` rather than being dropped. */
export function columnFiltersToFilterValues(
  fields: FilterField[],
  state: ColumnFiltersState,
): { values: FilterValues; unmapped: ColumnFiltersState } {
  const byColumn = new Map(fields.map((field) => [field.columnId ?? field.key, field]))
  const values: FilterValues = {}
  const unmapped: ColumnFiltersState = []
  for (const entry of state) {
    const field = byColumn.get(entry.id)
    if (field) values[field.key] = entry.value as FilterValue
    else unmapped.push(entry)
  }
  return { values: compactFilterValues(fields, values), unmapped }
}

/** Filter state for a FilterBar + Table pair. Pass a stable `fields` array (module constant or
 * `useMemo`) — the column filters are derived from it. */
export function useTableFilterState(fields: FilterField[], initialValues: FilterValues = {}) {
  const [values, setValuesState] = useState<FilterValues>(() => compactFilterValues(fields, initialValues))
  const [unmapped, setUnmapped] = useState<ColumnFiltersState>([])

  const columnFilters = useMemo(
    () => [...filterValuesToColumnFilters(fields, values), ...unmapped],
    [fields, values, unmapped],
  )

  const setValues = useCallback((next: FilterValues) => setValuesState(compactFilterValues(fields, next)), [fields])

  const onColumnFiltersChange = useCallback(
    (next: ColumnFiltersState) => {
      const mapped = columnFiltersToFilterValues(fields, next)
      setValuesState(mapped.values)
      setUnmapped(mapped.unmapped)
    },
    [fields],
  )

  return { values, setValues, columnFilters, onColumnFiltersChange }
}
