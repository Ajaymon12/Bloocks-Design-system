import type { ReactNode } from 'react'

// Shared vocabulary for every table cell (PlainTextCell, AmountCell, StatusCell, …), so a column
// can configure any cell the same way instead of each cell inventing its own alignment/tone/size
// props. See cellContext.ts for how a value is resolved from these (own prop > column meta >
// component default) and Cell.tsx for the plain escape-hatch cell built on top of them.
//
// Figma: Karbon - AI Accountant, Table body cells (node 24028:1090). Figma models one cell with a
// `Type` property (23 values) and an `Action` state — that enumeration is ~9 content shapes
// crossed with orthogonal modifiers (an icon, a trailing action, an alignment), which is why this
// system keeps the existing per-shape cell components instead of a single `type`-switched one, and
// only pulls the *orthogonal* modifiers (align, tone, size, truncate, empty, icon slots) out as
// shared props. `Action=Yes` is a hover/selected state, not a property — it's already the row-hover
// tint applied in Table.tsx, not modelled here.
//
// Figma `Type` → code, so nothing on the sheet is left unaccounted for:
//
//   Plain text                        <PlainTextCell>
//   Plain text (Action)               <PlainTextCell editable onEditClick={...}>
//   WITH Icon (+ Action)               + leadingIcon (+ editable)
//   Ai with text                       + leadingIcon={<Sparkles />} — a generic icon slot, not an
//                                       AI-specific prop; "and normal" is just omitting it
//   Ai with text Dropdown             <DropdownCell leadingIcon={<Sparkles />} .../>
//   Dropdown                          <DropdownCell>
//   Dropdown keybo                     same component, :focus-visible — a state, not a prop
//   Input                             <InputCell>
//   Button                            <ActionsCell> with 1 or 2 buttons — Figma's "single icon" /
//                                       "dual icon" actions column (node 603:2177)
//   Credit / Debit                    <AmountCell variant="credit" | "debit">
//   Amount                            <AmountCell> (variant="plain", the default — no suffix)
//   Status / with icon / with icon    <StatusCell color> / + icon / + info
//     and info
//   Progress bar                      <ProgressBarCell>
//   With sub text (+ Action)          <SubTextCell>
//   With Avatar / With Avatar sub     <AvatarCell>
//   Si No.                            any cell in a column with meta: { align: 'center' }
//   Type7                             unmapped — a design-file placeholder name, not a real cell
//
// Extras the sheet doesn't show but a real table needs, all shared props (this file) rather than
// new components: `isDisabled` (every cell — Dropdown/Input get the real `disabled` attribute,
// not just dimming), `tooltip` (the same native-title mechanism StatusCell.info already used,
// generalized), and a plain `<NumberCell>` for a quantity/percent with no currency formatting.
// "Active cell" is the keyboard-focused one — the global :focus-visible ring, no prop needed.
// "Hover state" is the existing row-hover tint (Table.tsx), which shows through Dropdown/Input's
// transparent background the same as any other cell. See Table.stories.tsx's `ActiveCell`,
// `DisabledCells`, `ActionIcons`, `WithTooltip` and `WithNumberCell` stories for each of these.

export type CellAlign = 'start' | 'center' | 'end'

/** Text color for a cell's primary content. Named after the same semantic vocabulary Badge and
 * Button use, not raw color names — 'notice' reads as amber, 'negative' as the danger color, etc. */
export type CellTone = 'default' | 'muted' | 'primary' | 'positive' | 'negative' | 'notice'

/** Matches `TableSize` (Table.tsx) — redeclared here so cells don't import from Table.tsx (Table
 * imports from cells/, not the other way around). */
export type CellSize = 'sm' | 'md'

/** `true` (default): one line, ellipsis past the edge. `false`: wraps freely. */
export type CellTruncate = boolean

/** Props every table cell accepts, on top of its own content props. All optional — a cell
 * resolves each via `useCellProps` (cellContext.ts) as **own prop > column `meta` > component
 * default**, so adding these to an existing cell never changes its current rendering. */
export type CellBaseProps = {
  align?: CellAlign
  tone?: CellTone
  size?: CellSize
  truncate?: CellTruncate
  /** Shown, muted, in place of the cell's primary value when that value is nullish or `''`.
   * Defaults to an em dash. */
  empty?: ReactNode
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /** Dims the cell and blocks interaction with anything inside it (a link, an edit button, a
   * native `<select>`/`<input>` in DropdownCell/InputCell gets the real `disabled` attribute too,
   * not just the visual treatment). Per-cell, not column-wide — a whole row of disabled cells is
   * the caller branching per row, same as any other row-dependent prop. */
  isDisabled?: boolean
  /** A native-tooltip hint shown on hover/focus, e.g. explaining why a value looks the way it
   * does. Same mechanism `StatusCell.info` already used, generalized to every cell. */
  tooltip?: string
  className?: string
}

/** `justify-content` for a cell whose root is a horizontal flex row. */
export const CELL_JUSTIFY: Record<CellAlign, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

/** Logical `text-align` — used directly on `<th>`/`<td>` (so bare string/number cell content
 * aligns too) and inside cells whose root isn't a horizontal flex row (e.g. a stacked cell). */
export const CELL_TEXT_ALIGN: Record<CellAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
}

export const CELL_TONE_CLASS: Record<CellTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  positive: 'text-success',
  negative: 'text-destructive',
  notice: 'text-warning',
}

/** Icon-slot sizing, scoped to the slot wrapper (`[&>svg]`, direct child only) — never a
 * descendant selector, which would also resize an icon nested two levels down inside e.g. a Badge
 * that StatusCell renders (Badge's own icons are sized for Badge, not for the cell). */
export const CELL_ICON_SLOT: Record<CellSize, string> = {
  sm: 'inline-flex shrink-0 items-center justify-center [&>svg]:size-3',
  md: 'inline-flex shrink-0 items-center justify-center [&>svg]:size-3.5',
}

/** Secondary text inside a cell — sub-text, a decimal remainder, a Cr/Dr suffix, a progress
 * label. One step below the cell's own body text at each size. */
export const CELL_SECONDARY_TEXT: Record<CellSize, string> = {
  sm: 'text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line-height)]',
  md: 'text-[length:var(--text-body-4-size)] leading-[var(--text-body-4-line-height)]',
}

/** Visual + interaction treatment for `isDisabled` — matches `BaseInput`'s disabled look
 * (opacity-50, no pointer) rather than inventing a second disabled style for cells. */
export const CELL_DISABLED_CLASS = 'opacity-50 cursor-not-allowed pointer-events-none'

/** The one definition of body-cell padding. `ui/table.tsx`'s `TableCell`, `InputCell` and
 * `DropdownCell` all use this instead of each restating the literals to match it. */
export const CELL_PADDING = 'px-[var(--space-12)] py-[var(--space-8)]'

/** `0` and `false` are real values; only nullish and `''` count as "no value" for a cell's
 * empty-state fallback. */
export function isCellValueEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}
