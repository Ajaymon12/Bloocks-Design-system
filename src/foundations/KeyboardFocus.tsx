import { useState } from 'react'
import { Button } from '@/components/Button'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Checkbox } from '@/components/Checkbox/Checkbox'
import { Combobox } from '@/components/Combobox'
import { FilterChip } from '@/components/FilterChip'
import { Select } from '@/components/Input/Select'
import { TextInput } from '@/components/Input/TextInput'
import { PlainTextCell, Table } from '@/components/Table'
import { DropdownCell } from '@/components/Table/cells/DropdownCell'
import { InputCell } from '@/components/Table/cells/InputCell'
import type { ColumnDef } from '@tanstack/react-table'

// A live gallery: every control below is the real component, so pressing Tab shows exactly what a
// keyboard user gets. Placeholder content only.

const OPTIONS = [
  { value: 'one', label: 'Option one' },
  { value: 'two', label: 'Option two' },
  { value: 'three', label: 'Option three' },
]

type Row = { name: string }
const ROWS: Row[] = [{ name: 'First row' }, { name: 'Second row' }]
const COLUMNS: ColumnDef<Row, any>[] = [
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <PlainTextCell>{row.original.name}</PlainTextCell> },
  {
    id: 'note',
    header: 'Note',
    meta: { fillCell: true },
    cell: () => <InputCell accessibilityLabel="Note" defaultValue="Editable" />,
  },
  {
    id: 'kind',
    header: 'Kind',
    meta: { fillCell: true },
    cell: () => <DropdownCell accessibilityLabel="Kind" options={OPTIONS} defaultValue="one" />,
  },
]

function Group({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <h4 style={{ margin: 0, color: 'var(--color-text)', fontFamily: 'var(--font-family-primary)' }}>{title}</h4>
        <p style={{ margin: '2px 0 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>{note}</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
        {children}
      </div>
    </section>
  )
}

export function KeyboardFocusGallery() {
  const [checked, setChecked] = useState(false)
  const [combo, setCombo] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
      <Group title="Buttons and links" note="2px primary ring, 2px outside the edge.">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Breadcrumb items={[{ label: 'Home', href: '#' }, { label: 'Section', href: '#' }, { label: 'Page' }]} />
      </Group>
      <Group title="Text fields" note="Border turns primary and a soft ring surrounds the field; the browser outline is suppressed.">
        <TextInput label="Name" placeholder="Type here" />
        <Select label="Choice" options={OPTIONS} defaultValue="one" />
        <div style={{ width: 200 }}>
          <Combobox accessibilityLabel="Combobox" options={OPTIONS} value={combo} onChange={setCombo} />
        </div>
      </Group>
      <Group title="Checkbox and filter chip" note="Chips clip their contents, so the ring is drawn inside the chip.">
        <Checkbox isChecked={checked} onChange={(event) => setChecked(event.target.checked)}>
          Remember me
        </Checkbox>
        <FilterChip label="Filter" value="Value" />
      </Group>
      <Group
        title="Table cells"
        note="A focused cell gets a single 1px primary border on the grid lines. Arrow keys move; Enter edits; Esc cancels."
      >
        <div style={{ width: '100%' }}>
          <Table columns={COLUMNS} data={ROWS} enableSorting={false} />
        </div>
      </Group>
    </div>
  )
}
