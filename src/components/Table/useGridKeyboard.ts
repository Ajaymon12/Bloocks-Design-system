import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

// Keyboard model for the grid. The table has two modes, like a spreadsheet:
//
//   Navigating — a cell (or a header) has focus. Arrow keys move, Shift+arrows select a range,
//                Enter/Space act on the cell, Ctrl+C copies.
//   Editing    — a text field inside a cell has focus. Keys belong to the field; only Enter
//                (accept) and Esc (cancel, restoring the value) hand control back to the grid.
//
// It's a native, document-level *capture* listener rather than a React prop on the cell: a nested
// interactive control (e.g. Radix's Checkbox) can attach its own native listener and stop the
// event before React's per-fiber capture ever sees it, and arrow/Home/End should always mean "move
// the active cell" regardless of what a descendant does.

export type CellPosition = { row: number; col: number }
export type CellRange = { anchor: CellPosition; focus: CellPosition }

/** Rows moved by PgUp / PgDn. */
const PAGE_JUMP = 10

const NON_TEXT_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'range', 'color'])

/** A control that owns the keyboard while it has focus — typing, caret movement, native picking. */
function isTextField(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (!element) return false
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return true
  if (element instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(element.type)
  return (element as HTMLElement).isContentEditable
}

/** What a cell reads as on screen (or the value of the field inside it), for copying. */
function cellText(cell: HTMLElement): string {
  const field = cell.querySelector<HTMLInputElement>('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])')
  if (field) return field.value
  return cell.innerText.replace(/\s+/g, ' ').trim()
}

/** Puts a value back into a React-controlled field: React only reacts to the *native* setter
 * followed by a real `input` event, not to a plain `.value =` assignment. */
function restoreFieldValue(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(field, value)
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Presses the first control in a cell: a checkbox toggles, a link/button clicks, a dropdown
 * opens, a text field takes focus for editing. */
function activateCell(cell: HTMLElement) {
  const control = cell.querySelector<HTMLElement>(
    'button, a[href], input:not([type="hidden"]):not([aria-hidden="true"]), textarea',
  )
  if (!control || control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true') return
  if (isTextField(control)) {
    control.focus()
    if (control instanceof HTMLInputElement) control.select()
  } else {
    control.click()
  }
}

/** Clicks the first match for `primary`, or for `fallback` when the cell has none. */
function pressFirst(root: HTMLElement, primary: string, fallback: string) {
  const target = root.querySelector<HTMLElement>(primary) ?? root.querySelector<HTMLElement>(fallback)
  target?.click()
}

type Options = {
  containerRef: RefObject<HTMLElement | null>
  rowCount: number
  colCount: number
  /** Column index of the row-selection checkbox, left out of copied text. */
  skipCol?: number
  /** Changes whenever the visible rows/columns change (page, sort, filter, column set), which
   * drops a range that would otherwise point at cells that are no longer there. */
  resetKey: string
}

export function useGridKeyboard({ containerRef, rowCount, colCount, skipCol, resetKey }: Options) {
  const [rangeState, setRangeState] = useState<(CellRange & { key: string }) | null>(null)
  const range = rangeState && rangeState.key === resetKey ? rangeState : null

  // The listeners below are attached once, so they read the latest values through this ref.
  const latest = useRef({ rowCount, colCount, skipCol, resetKey, range })
  useEffect(() => {
    latest.current = { rowCount, colCount, skipCol, resetKey, range }
  })

  // Set while the keyboard is moving focus to extend a range, so the focus handler doesn't take
  // that focus change for a click and clear the range it's building.
  const extending = useRef(false)

  /** Call from each cell's `onFocus`: focus arriving any way other than range extension (a click,
   * Tab) starts a fresh selection. */
  function handleCellFocus() {
    if (!extending.current && latest.current.range) setRangeState(null)
  }

  useEffect(() => {
    let editStart: { field: HTMLInputElement | HTMLTextAreaElement; value: string } | null = null

    const cell = (row: number, col: number) =>
      containerRef.current?.querySelector<HTMLElement>(`td[data-row="${row}"][data-col="${col}"]`) ?? null
    const header = (col: number) =>
      containerRef.current?.querySelector<HTMLElement>(`th[data-header-col="${col}"]`) ?? null

    function focusCell(position: CellPosition, extend: boolean) {
      extending.current = extend
      cell(position.row, position.col)?.focus()
      extending.current = false
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target as Element | null
      if (isTextField(target) && !(target instanceof HTMLSelectElement) && target.closest('td[data-row]')) {
        editStart = { field: target as HTMLInputElement | HTMLTextAreaElement, value: (target as HTMLInputElement).value }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const container = containerRef.current
      const active = document.activeElement
      if (!container || !active || !container.contains(active)) return
      // The toolbar (filter chips, Columns) and the bulk action bar live inside the container but
      // aren't part of the grid: their keys belong to their own controls.
      if (active.closest('[data-table-toolbar], [data-table-bulk-actions]')) return

      const td = active.closest<HTMLElement>('td[data-row][data-col]')
      const th = active.closest<HTMLElement>('th[data-header-col]')
      if (!td && !th) return

      // Editing: the field owns the keyboard. Enter accepts, Esc cancels and restores.
      if (isTextField(active)) {
        if (!td) return
        if (event.key === 'Escape') {
          if (editStart?.field === active) restoreFieldValue(editStart.field, editStart.value)
          td.focus()
        } else if (event.key === 'Enter' && !(active instanceof HTMLTextAreaElement && event.shiftKey)) {
          td.focus()
        } else {
          return
        }
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (event.metaKey || event.altKey) return
      // Ctrl is only meaningful with Home/End here; Ctrl+C is the copy event, handled below.
      if (event.ctrlKey && event.key !== 'Home' && event.key !== 'End') return

      const { rowCount: rows, colCount: cols, resetKey: key, range: current } = latest.current
      const lastRow = rows - 1
      const lastCol = cols - 1
      const consume = () => {
        event.preventDefault()
        event.stopPropagation()
      }

      // A header cell: move along the headers, drop into the grid, sort with Enter, filter with
      // Space. (Focus on a control *inside* the header — its sort button — is left to that control.)
      if (th) {
        if (active !== th) return
        const col = Number(th.dataset.headerCol)
        switch (event.key) {
          case 'ArrowLeft':
            header(Math.max(0, col - 1))?.focus()
            break
          case 'ArrowRight':
            header(Math.min(lastCol, col + 1))?.focus()
            break
          case 'Home':
            header(0)?.focus()
            break
          case 'End':
            header(lastCol)?.focus()
            break
          case 'ArrowDown':
            if (rows > 0) focusCell({ row: 0, col }, false)
            break
          case 'Enter':
            pressFirst(th, '[data-sort-toggle]', '[data-column-filter]')
            break
          case ' ':
            pressFirst(th, '[data-column-filter]', '[data-sort-toggle]')
            break
          default:
            return
        }
        consume()
        return
      }

      // A body cell.
      const row = Number(td!.dataset.row)
      const col = Number(td!.dataset.col)

      if (event.key === 'Escape') {
        if (current) {
          setRangeState(null)
          consume()
        }
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        // Only when the cell itself has focus — a checkbox or button inside it handles its own.
        if (active !== td) return
        activateCell(td!)
        consume()
        return
      }

      const next = { row, col }
      switch (event.key) {
        case 'ArrowUp':
          // Off the top of the grid is the header row, unless Shift is extending a range.
          if (row === 0 && !event.shiftKey) {
            setRangeState(null)
            header(col)?.focus()
            consume()
            return
          }
          next.row = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          next.row = Math.min(lastRow, row + 1)
          break
        case 'ArrowLeft':
          next.col = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          next.col = Math.min(lastCol, col + 1)
          break
        case 'Home':
          if (event.ctrlKey) next.row = 0
          else next.col = 0
          break
        case 'End':
          if (event.ctrlKey) next.row = lastRow
          else next.col = lastCol
          break
        case 'PageUp':
          next.row = Math.max(0, row - PAGE_JUMP)
          break
        case 'PageDown':
          next.row = Math.min(lastRow, row + PAGE_JUMP)
          break
        default:
          return
      }

      consume()
      if (event.shiftKey) {
        setRangeState({ anchor: current?.anchor ?? { row, col }, focus: next, key })
        focusCell(next, true)
      } else {
        setRangeState(null)
        focusCell(next, false)
      }
    }

    function handleCopy(event: ClipboardEvent) {
      const container = containerRef.current
      const active = document.activeElement
      if (!container || !active || !container.contains(active) || isTextField(active)) return
      if (active.closest('[data-table-toolbar], [data-table-bulk-actions]')) return
      const td = active.closest<HTMLElement>('td[data-row][data-col]')
      if (!td) return
      // Leave a hand-made text selection to the browser.
      if (window.getSelection()?.toString()) return

      const { range: current, skipCol: skip } = latest.current
      const from = current?.anchor ?? { row: Number(td.dataset.row), col: Number(td.dataset.col) }
      const to = current?.focus ?? from
      const lines: string[] = []
      for (let r = Math.min(from.row, to.row); r <= Math.max(from.row, to.row); r += 1) {
        const values: string[] = []
        for (let c = Math.min(from.col, to.col); c <= Math.max(from.col, to.col); c += 1) {
          if (c === skip) continue
          const source = cell(r, c)
          if (source) values.push(cellText(source))
        }
        lines.push(values.join('\t'))
      }
      event.clipboardData?.setData('text/plain', lines.join('\n'))
      event.preventDefault()
    }

    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('copy', handleCopy, true)
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('copy', handleCopy, true)
    }
  }, [containerRef])

  function isInRange(row: number, col: number) {
    if (!range) return false
    return (
      row >= Math.min(range.anchor.row, range.focus.row) &&
      row <= Math.max(range.anchor.row, range.focus.row) &&
      col >= Math.min(range.anchor.col, range.focus.col) &&
      col <= Math.max(range.anchor.col, range.focus.col)
    )
  }

  return { range, isInRange, handleCellFocus }
}
