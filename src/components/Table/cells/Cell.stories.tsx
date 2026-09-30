import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
// Icons picked from Foundations → Icons in Storybook — that's the source of truth for what's
// available and already in use. Keep src/foundations/usedIcons.ts in sync with these.
import { Check, ChevronRight, Landmark, MoreHorizontal, Sparkles } from 'lucide-react'
import { Cell } from './Cell'
import type { CellTone } from './cellVariants'
import { PlainTextCell } from './PlainTextCell'
import { SubTextCell } from './SubTextCell'
import { AmountCell } from './AmountCell'
import { NumberCell } from './NumberCell'
import { StatusCell } from './StatusCell'
import { AvatarCell } from './AvatarCell'
import { LinkCell } from './LinkCell'
import { ProgressBarCell } from './ProgressBarCell'
import { SyncStatusCell } from './SyncStatusCell'
import { DateCell } from './DateCell'
import { DropdownCell } from './DropdownCell'
import { InputCell } from './InputCell'
import { ActionsCell } from './ActionsCell'

// `Cell` is the plain building block every table cell (PlainTextCell, AmountCell, StatusCell, …)
// shares its base props with — align, tone, size, truncate, empty, icon slots — and the direct
// escape hatch for content none of them cover. See Table.stories.tsx for the same properties
// exercised through those higher-level cells inside a real grid (e.g. `ColumnAlignment`).

const meta = {
  title: 'Components/Table/Cell',
  component: Cell,
  tags: ['ai-generated', 'autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Every table cell — \`PlainTextCell\`, \`AmountCell\`, \`StatusCell\`, and the rest — shares this same
set of base props, resolved as **own prop > column \`meta\` > component default** (see
\`cellContext.ts\`). \`Cell\` is the plain one built directly from them, and the escape hatch for
content none of the named cells cover.

**Figma's cell sheet, mapped** (Karbon - AI Accountant, node 24028:1090 — one component with a
\`Type\` property, 23 values):

| Figma \`Type\` | Code |
|---|---|
| Plain text / Plain text (Action) | \`<PlainTextCell>\` / \`+ editable\` |
| WITH Icon (+ Action) | \`+ leadingIcon\` (\`+ editable\`) |
| Ai with text (+ Dropdown) | \`+ leadingIcon={<Sparkles />}\` — a generic slot, not AI-specific |
| Dropdown / Dropdown keybo | \`<DropdownCell>\` — "keybo" is its own \`:focus-visible\` state |
| Input | \`<InputCell>\` |
| Button | \`<ActionsCell>\` with 1–2 buttons (Figma's single/dual-icon actions column) |
| Credit / Debit / Amount | \`<AmountCell variant="credit" \\| "debit" \\| "plain">\` |
| Status (+ icon, + info) | \`<StatusCell color icon info>\` |
| Progress bar | \`<ProgressBarCell>\` |
| With sub text (+ Action) | \`<SubTextCell>\` |
| With Avatar (sub) | \`<AvatarCell>\` |
| Si No. | any cell with \`meta: { align: 'center' }\` |
| Type7 | unmapped — a design-file placeholder, not a real cell |

**Not on the sheet, but every cell has it too:** \`isDisabled\` (Dropdown/Input get the real
\`disabled\` attribute, not just dimming — see the \`Disabled\` story here and \`DisabledCells\` on
\`Components/Table\`), \`tooltip\` (a native-title hint, the same mechanism \`StatusCell.info\` used
— see \`Tooltip\`), and a plain \`NumberCell\` for a count/percent with no currency formatting (see
\`WithNumberCell\` on \`Components/Table\`). The "active" cell is just the keyboard-focused one —
the system's global focus ring, nothing to opt into (\`ActiveCell\`).
        `,
      },
    },
  },
} satisfies Meta<typeof Cell>

export default meta
type Story = StoryObj<typeof meta>

const labelStyle = { width: 96, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)' } as const
const boxStyle = { width: 160, padding: '8px 12px', border: '1px solid var(--color-table-border)', borderRadius: 6 } as const

export const Default: Story = {
  args: { children: 'Bank Accounts' },
  render: (args) => (
    <div style={boxStyle}>
      <Cell {...args} />
    </div>
  ),
}

const galleryLabelStyle = { width: 220, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)' } as const
const galleryBoxStyle = { minWidth: 180, padding: '8px 12px', border: '1px solid var(--color-table-border)', borderRadius: 6 } as const
// Dropdown/Input fill their own cell edge-to-edge (see meta.fillCell in Table.tsx) — their own
// internal padding replaces the box's, so the box here supplies only a fixed height and no padding.
const galleryFillBoxStyle = { minWidth: 180, height: 34, border: '1px solid var(--color-table-border)', borderRadius: 6, overflow: 'hidden' } as const

const LEDGER_OPTIONS = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'payment', label: 'Payment' },
]

function GalleryRow({ label, fill = false, children }: { label: string; fill?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={galleryLabelStyle}>{label}</span>
      {/* `group` so PlainTextCell's `editable` pencil (group-hover) has something to hover — in a
       * real table that ancestor is the row `<tr>` (ui/table.tsx). */}
      <div className="group" style={fill ? galleryFillBoxStyle : galleryBoxStyle}>
        {children}
      </div>
    </div>
  )
}

/**
 * Every Figma `Type` from the cell sheet (see this page's description above), rendered with the
 * actual component — one place to see the whole set side by side, the same way the Figma sheet
 * itself lays them out. `Table.stories.tsx` shows the same cells doing real work inside a grid
 * (sorting, filtering, resizing); this page is the reference for what each one looks like alone.
 */
export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <GalleryRow label="Plain text">
        <PlainTextCell>Receipt</PlainTextCell>
      </GalleryRow>
      <GalleryRow label="Plain text (Action)">
        <PlainTextCell editable onEditClick={() => {}}>
          Receipt
        </PlainTextCell>
      </GalleryRow>
      <GalleryRow label="WITH Icon">
        <PlainTextCell leadingIcon={<Landmark />}>Bank Accounts</PlainTextCell>
      </GalleryRow>
      <GalleryRow label="WITH Icon (Action)">
        <PlainTextCell leadingIcon={<Landmark />} editable onEditClick={() => {}}>
          Bank Accounts
        </PlainTextCell>
      </GalleryRow>
      <GalleryRow label="Ai with text">
        <PlainTextCell leadingIcon={<Sparkles />}>Receipt</PlainTextCell>
      </GalleryRow>
      <GalleryRow label="Ai with text Dropdown" fill>
        <DropdownCell accessibilityLabel="Type (AI)" leadingIcon={<Sparkles />} options={LEDGER_OPTIONS} defaultValue="receipt" />
      </GalleryRow>
      <GalleryRow label="Dropdown" fill>
        <DropdownCell accessibilityLabel="Type" options={LEDGER_OPTIONS} defaultValue="receipt" />
      </GalleryRow>
      <GalleryRow label="Input" fill>
        <InputCell accessibilityLabel="Narration" defaultValue="Sale of goods to distributor" />
      </GalleryRow>
      <GalleryRow label="Button">
        <ActionsCell>
          <button
            type="button"
            aria-label="Row actions"
            className="inline-flex items-center justify-center border-0 rounded-[var(--radius-6)] cursor-pointer bg-transparent text-muted-foreground hover:bg-[var(--color-bg-subtle)] hover:text-foreground p-0 w-7 h-7"
          >
            <MoreHorizontal size={14} />
          </button>
        </ActionsCell>
      </GalleryRow>
      <GalleryRow label="Credit">
        <AmountCell amount={19000} variant="credit" />
      </GalleryRow>
      <GalleryRow label="Debit">
        <AmountCell amount={19000} variant="debit" />
      </GalleryRow>
      <GalleryRow label="Amount">
        <AmountCell amount={19000} variant="plain" />
      </GalleryRow>
      <GalleryRow label="Status">
        <StatusCell color="positive">Paid</StatusCell>
      </GalleryRow>
      <GalleryRow label="Status with icon">
        <StatusCell color="positive" icon={<Check size={10} />}>
          Paid
        </StatusCell>
      </GalleryRow>
      <GalleryRow label="Status with icon and info">
        <StatusCell color="negative" icon={<Check size={10} />} info="This invoice couldn't be read.">
          Failed
        </StatusCell>
      </GalleryRow>
      <GalleryRow label="Progress bar">
        <ProgressBarCell label={10} percent={67} />
      </GalleryRow>
      <GalleryRow label="With sub text">
        <SubTextCell subText="Bank Ledger">HDFC Current A/c</SubTextCell>
      </GalleryRow>
      <GalleryRow label="With Avatar">
        <AvatarCell name="Lakksith" />
      </GalleryRow>
      <GalleryRow label="With Avatar sub">
        <AvatarCell name="Lakksith" subText="Engineer" />
      </GalleryRow>
      <GalleryRow label="Link">
        <LinkCell href="#">H-102</LinkCell>
      </GalleryRow>
      <GalleryRow label="Sync status">
        <SyncStatusCell status="synced" />
      </GalleryRow>
      <GalleryRow label="Date">
        <DateCell value={new Date(2026, 7, 22)} />
      </GalleryRow>
      <GalleryRow label="Number">
        <NumberCell value={128} />
      </GalleryRow>
      <GalleryRow label="Si No.">
        <PlainTextCell align="center">1</PlainTextCell>
      </GalleryRow>
      <GalleryRow label="Empty cell (—)">
        <Cell>{null}</Cell>
      </GalleryRow>
      <GalleryRow label="Type7">
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          unmapped — design-file placeholder
        </span>
      </GalleryRow>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // storybook/test's `canvas` binding scopes queries to the story root by default, which is
    // fine for every other story here — this one specifically re-scopes with `within` so the
    // intent (checking the whole gallery renders) reads the same way at every call site below.
    const canvas = within(canvasElement)
    // A button that opens the option panel, not a native <select>, so it shows text rather than a value.
    await expect(canvas.getByRole('combobox', { name: 'Type' })).toHaveTextContent('Receipt')
    await expect(canvas.getByRole('textbox', { name: 'Narration' })).toHaveValue('Sale of goods to distributor')
    await expect(canvas.getByText('Bank Ledger')).toBeVisible() // sub-text row
    await expect(canvas.getAllByText('Paid').length).toBeGreaterThan(0) // badge rows
    await expect(canvas.getByText('Cr')).toBeVisible()
    await expect(canvas.getByText('Dr')).toBeVisible()
    await expect(canvas.queryAllByText('Cr').length).toBe(1) // the plain Amount row has no suffix
    await expect(canvas.getByText('22 Aug 2026')).toBeVisible()
    await expect(canvas.getByText('—')).toBeVisible()
  },
}

const TONES: CellTone[] = ['default', 'muted', 'primary', 'positive', 'negative', 'notice']

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {TONES.map((tone) => (
        <div key={tone} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={labelStyle}>{tone}</span>
          <div style={boxStyle}>
            <Cell tone={tone}>Sample text</Cell>
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['start', 'center', 'end'] as const).map((align) => (
        <div key={align} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={labelStyle}>{align}</span>
          <div style={boxStyle}>
            <Cell align={align}>12</Cell>
          </div>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    const spans = canvas.getAllByText('12').map((el) => el.closest('div')!)
    await expect(getComputedStyle(spans[0]).justifyContent).toBe('flex-start')
    await expect(getComputedStyle(spans[1]).justifyContent).toBe('center')
    await expect(getComputedStyle(spans[2]).justifyContent).toBe('flex-end')
  },
}

/** No value renders a muted em dash instead of a blank box — pass `empty` for a labeled
 * placeholder (e.g. "Not Mapped"). */
export const Empty: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={boxStyle}>
        <Cell>{null}</Cell>
      </div>
      <div style={boxStyle}>
        <Cell empty="Not Mapped">{null}</Cell>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('—')).toBeVisible()
    await expect(canvas.getByText('Not Mapped')).toBeVisible()
  },
}

export const Disabled: Story = {
  args: { children: 'Locked value', isDisabled: true },
  render: (args) => (
    <div style={boxStyle}>
      <Cell {...args} />
    </div>
  ),
}

/** The same native-tooltip mechanism `StatusCell.info` uses, generalized to every cell. */
export const Tooltip: Story = {
  args: { children: 'Hover me', tooltip: 'Extra context shown on hover' },
  render: (args) => (
    <div style={boxStyle}>
      <Cell {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Hover me').closest('div')).toHaveAttribute('title', 'Extra context shown on hover')
  },
}

export const WithIcons: Story = {
  args: {
    children: 'HDFC Current Account',
    leadingIcon: <Landmark />,
    trailingIcon: <ChevronRight />,
  },
  render: (args) => (
    <div style={boxStyle}>
      <Cell {...args} />
    </div>
  ),
}

/** `truncate` (default `true`) clips to one line with an ellipsis; set it to `false` to let the
 * text wrap. In a real table, a column sets this once via `meta: { truncate: false }` instead of
 * repeating it on every cell — see the `TextWrap` story on `Components/Table`. */
export const Truncate: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={labelStyle}>truncate</span>
        <div style={boxStyle}>
          <Cell>MPS/P2A/934820165741/BHARAT SALES CORPORATION</Cell>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={labelStyle}>truncate=false</span>
        <div style={boxStyle}>
          <Cell truncate={false}>MPS/P2A/934820165741/BHARAT SALES CORPORATION</Cell>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const wrapped = canvas.getByText(/BHARAT SALES CORPORATION/, { selector: 'span.whitespace-normal' })
    await expect(wrapped.className).toContain('whitespace-normal')
  },
}
