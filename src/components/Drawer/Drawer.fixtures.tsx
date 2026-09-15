import { useState } from 'react'
import { Check, ChevronRight, CirclePlay, Folder, Paperclip, Plus, Save, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { buttonVariants } from '@/components/Button/buttonVariants'
import { Combobox } from '@/components/Combobox/Combobox'
import { DatePicker } from '@/components/DatePicker/DatePicker'
import { BaseInput } from '@/components/Input/BaseInput/BaseInput'
import { Select } from '@/components/Input/Select/Select'
import { TextInput } from '@/components/Input/TextInput/TextInput'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader, DrawerSection } from './Drawer'

// Mock drawers for the stories. Every name, label and value here is a generic placeholder.

const labelTwo =
  'text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)]'
const labelThree =
  'text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] tracking-[var(--text-label-3-letter-spacing)]'

/* ----------------------------------------------------------------------------------------------
 * Help centre — the narrow panel (Figma node 21746:48989): a featured video, a grid of topics,
 * and a topic view with a back button.
 * -------------------------------------------------------------------------------------------- */

type HelpVideo = { id: string; title: string; duration: string }
type HelpTopic = { id: string; title: string; videos: HelpVideo[] }

const HELP_TOPICS: HelpTopic[] = [
  { id: 'getting-started', title: 'Getting started', videos: [{ id: 'gs-1', title: 'Getting started basics', duration: '4:20' }] },
  {
    id: 'projects',
    title: 'Projects',
    videos: [
      { id: 'pr-1', title: 'Projects walkthrough', duration: '3:45' },
      { id: 'pr-2', title: 'Edit items in place', duration: '2:10' },
      { id: 'pr-3', title: 'Bulk edit', duration: '1:58' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    videos: [
      { id: 'rp-1', title: 'Build your first report', duration: '5:02' },
      { id: 'rp-2', title: 'Share and export', duration: '2:36' },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    videos: [
      { id: 'tm-1', title: 'Invite teammates', duration: '1:40' },
      { id: 'tm-2', title: 'Roles and permissions', duration: '3:12' },
    ],
  },
  { id: 'integrations', title: 'Integrations', videos: [{ id: 'in-1', title: 'Connect an app', duration: '2:48' }] },
]

function VideoCard({ video }: { video: HelpVideo }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full cursor-pointer items-center gap-[var(--space-16)] rounded-[var(--radius-8)] border border-solid border-[var(--color-border-subtle)]',
        'bg-[var(--color-drawer-bg)] p-[var(--space-12)] text-left shadow-[0_2px_4px_rgba(0,0,0,0.04)] transition-colors duration-150',
        'hover:border-[var(--color-popover-border)]',
      )}
    >
      {/* A neutral stand-in for a video thumbnail. */}
      <span
        aria-hidden="true"
        className="flex h-[80px] w-[140px] shrink-0 items-center justify-center rounded-[var(--radius-6)] bg-[linear-gradient(135deg,var(--color-topnav-bg),var(--color-topnav-border))] text-[var(--color-topnav-text)]"
      >
        <CirclePlay size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-4)]">
        <span className={cn('truncate text-foreground', labelTwo)}>{video.title}</span>
        <span className={cn('inline-flex items-center gap-[var(--space-4)] text-[var(--color-text-secondary)]', labelThree)}>
          <CirclePlay size={10} />
          {video.duration}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-[var(--color-text-secondary)]" />
    </button>
  )
}

function TopicCard({ title, isCurrent, onClick }: { title: string; isCurrent: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCurrent}
      title={isCurrent ? 'You are viewing this topic' : undefined}
      className={cn(
        'flex min-w-0 cursor-pointer flex-col items-center gap-[var(--space-8)] rounded-[10px] border border-solid border-[var(--color-border-subtle)]',
        'bg-[var(--color-drawer-bg)] px-[var(--space-16)] py-[var(--space-12)] text-foreground transition-colors duration-150',
        'hover:border-[var(--color-popover-border)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--color-border-subtle)]',
      )}
    >
      <Folder size={24} className="text-[var(--color-popover-border)]" />
      <span className={cn('max-w-full truncate', labelThree)}>{title}</span>
    </button>
  )
}

export function HelpCenterDrawer({
  isOpen,
  onDismiss,
  topOffset,
}: {
  isOpen: boolean
  onDismiss: () => void
  topOffset?: number
}) {
  const [openTopicId, setOpenTopicId] = useState<string | null>(null)
  const current = HELP_TOPICS[0]
  const openTopic = HELP_TOPICS.find((topic) => topic.id === openTopicId)

  function dismiss() {
    setOpenTopicId(null)
    onDismiss()
  }

  return (
    <Drawer isOpen={isOpen} onDismiss={dismiss} size="medium" topOffset={topOffset}>
      {openTopic ? (
        <>
          <DrawerHeader
            title={openTopic.title}
            subtitle={`${openTopic.videos.length} ${openTopic.videos.length === 1 ? 'video' : 'videos'}`}
            showBackButton
            onBackButtonClick={() => setOpenTopicId(null)}
            showCloseButton={false}
          />
          <DrawerBody>
            <div className="flex flex-col gap-[var(--space-16)]">
              {openTopic.videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </DrawerBody>
        </>
      ) : (
        <>
          <DrawerHeader title={current.title} subtitle="Watch this video, or pick another topic below." showCloseButton={false} />
          <DrawerBody>
            {current.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
            <hr className="m-0 h-px shrink-0 border-0 bg-[var(--color-border-subtle)]" />
            <div className="flex flex-col gap-[var(--space-12)]">
              <h3 className="m-0 text-[length:var(--text-body-3-size)] leading-[var(--text-body-3-line-height)] font-medium text-[var(--color-text-secondary)]">
                Other topics
              </h3>
              <div className="grid grid-cols-3 gap-[var(--space-12)]">
                {HELP_TOPICS.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    title={topic.title}
                    isCurrent={topic.id === current.id}
                    onClick={() => setOpenTopicId(topic.id)}
                  />
                ))}
              </div>
            </div>
          </DrawerBody>
        </>
      )}
    </Drawer>
  )
}

/* ----------------------------------------------------------------------------------------------
 * Record details — the wide panel (Figma node 10672:53263): a summary header with a field
 * picker, section cards, editable line items, notes, and footer actions.
 * -------------------------------------------------------------------------------------------- */

const TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express' },
  { value: 'custom', label: 'Custom' },
]

const OWNER_OPTIONS = [
  { value: 'jane', label: 'Jane Doe' },
  { value: 'john', label: 'John Smith' },
  { value: 'alex', label: 'Alex Kim' },
]

const ITEM_OPTIONS = [
  { value: 'item-a', label: 'Item A' },
  { value: 'item-b', label: 'Item B' },
  { value: 'item-c', label: 'Item C' },
  { value: 'item-d', label: 'Item D' },
]

const OPTIONAL_FIELDS = [
  { key: 'dueDate', label: 'Due date' },
  { key: 'owner', label: 'Owner' },
  { key: 'externalReference', label: 'External reference' },
  { key: 'tags', label: 'Tags' },
] as const

type OptionalFieldKey = (typeof OPTIONAL_FIELDS)[number]['key']

type LineItem = { id: number; item: string; quantity: string; amount: string }

const INITIAL_LINE_ITEMS: LineItem[] = [
  { id: 1, item: 'item-a', quantity: '4', amount: '8,000.00' },
  { id: 2, item: 'item-c', quantity: '2', amount: '4,480.00' },
]

function SummaryItem({ label, children, isLast = false }: { label: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-[var(--space-4)] pr-[var(--space-48)]',
        !isLast && 'border-r border-solid border-[var(--color-border-subtle)]',
      )}
    >
      <dt className={cn('text-[var(--color-text-secondary)]', labelThree)}>{label}</dt>
      <dd className={cn('m-0 font-medium text-foreground', labelTwo)}>{children}</dd>
    </div>
  )
}

export function RecordDetailsDrawer({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const [visibleFields, setVisibleFields] = useState<Record<OptionalFieldKey, boolean>>({
    dueDate: true,
    owner: true,
    externalReference: false,
    tags: false,
  })
  const [type, setType] = useState('standard')
  const [owner, setOwner] = useState('jane')
  const [lineItems, setLineItems] = useState(INITIAL_LINE_ITEMS)
  const nextId = Math.max(0, ...lineItems.map((line) => line.id)) + 1
  const visibleCount = Object.values(visibleFields).filter(Boolean).length

  function updateLine(id: number, patch: Partial<LineItem>) {
    setLineItems((lines) => lines.map((line) => (line.id === id ? { ...line, ...patch } : line)))
  }

  return (
    <Drawer isOpen={isOpen} onDismiss={onDismiss} size="large">
      <DrawerHeader
        title="Record details"
        trailing={
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                // Figma's header options button: a primary outline rather than the neutral one.
                'border border-solid border-[var(--color-primary)] text-primary',
              )}
            >
              <SlidersHorizontal size={16} />
              Fields
              <span className="rounded-[var(--radius-4)] bg-[var(--color-badge-primary-bg)] px-[var(--space-8)] text-primary">
                {visibleCount}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              {OPTIONAL_FIELDS.map((field) => (
                <DropdownMenuCheckboxItem
                  key={field.key}
                  checked={visibleFields[field.key]}
                  onCheckedChange={(checked) =>
                    setVisibleFields((fields) => ({ ...fields, [field.key]: checked === true }))
                  }
                >
                  {field.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="flex flex-col gap-[var(--space-16)]">
          <div className="flex items-end gap-[var(--space-12)]">
            <span className="text-[length:var(--text-h4-size)] leading-[var(--text-h4-line-height)] tracking-[var(--text-h4-letter-spacing)] font-semibold text-foreground">
              $12,480.00
            </span>
            <Badge color="primary" size="lg">
              Open
            </Badge>
          </div>
          <dl className="m-0 flex flex-wrap gap-y-[var(--space-8)] [&>div+div]:pl-[var(--space-24)]">
            <SummaryItem label="Description">Quarterly supply order</SummaryItem>
            <SummaryItem label="Owner">Jane Doe</SummaryItem>
            <SummaryItem label="Created">12 Mar 2026</SummaryItem>
            <SummaryItem label="Status" isLast>
              <Badge color="notice" size="md">
                Pending
              </Badge>
            </SummaryItem>
          </dl>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <DrawerSection title="General">
          <div className="grid grid-cols-3 gap-[var(--space-16)]">
            <Select label="Type" options={TYPE_OPTIONS} value={type} onChange={(event) => setType(event.target.value)} />
            <TextInput label="Reference no." defaultValue="REF-2026-0042" />
            <DatePicker label="Date" />
            {visibleFields.dueDate && <DatePicker label="Due date" />}
            {visibleFields.owner && <Combobox label="Owner" options={OWNER_OPTIONS} value={owner} onChange={setOwner} />}
            {visibleFields.externalReference && <TextInput label="External reference" placeholder="Enter a reference" />}
            {visibleFields.tags && <TextInput label="Tags" placeholder="Add tags" />}
          </div>
        </DrawerSection>

        <DrawerSection title="Line items">
          <div className="overflow-hidden rounded-[var(--radius-6)] border border-solid border-[var(--color-border-subtle)]">
            <div
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_120px_180px_36px] gap-[var(--space-12)] bg-[var(--color-table-header-bg)] px-[var(--space-12)] py-[var(--space-12)]',
                'font-semibold text-[var(--color-text-secondary)]',
                labelThree,
              )}
            >
              <span>Item</span>
              <span>Quantity</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Actions</span>
            </div>
            {lineItems.map((line, index) => (
              <div
                key={line.id}
                className="grid grid-cols-[minmax(0,1fr)_120px_180px_36px] items-center gap-[var(--space-12)] border-t border-solid border-[var(--color-border-subtle)] px-[var(--space-12)] py-[var(--space-12)]"
              >
                <Combobox
                  accessibilityLabel={`Item, row ${index + 1}`}
                  options={ITEM_OPTIONS}
                  value={line.item}
                  onChange={(item) => updateLine(line.id, { item })}
                />
                <TextInput
                  accessibilityLabel={`Quantity, row ${index + 1}`}
                  type="number"
                  value={line.quantity}
                  onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
                />
                <TextInput
                  accessibilityLabel={`Amount, row ${index + 1}`}
                  prefix="$"
                  value={line.amount}
                  onChange={(event) => updateLine(line.id, { amount: event.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<Trash2 size={16} />}
                  accessibilityLabel={`Remove row ${index + 1}`}
                  onClick={() => setLineItems((lines) => lines.filter((candidate) => candidate.id !== line.id))}
                />
              </div>
            ))}
            <div className="border-t border-solid border-[var(--color-border-subtle)] px-[var(--space-12)] py-[var(--space-8)]">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Plus size={16} />}
                onClick={() => setLineItems((lines) => [...lines, { id: nextId, item: '', quantity: '1', amount: '' }])}
              >
                Add item
              </Button>
            </div>
          </div>
          <dl className="m-0 ml-auto flex w-[373px] flex-col overflow-hidden rounded-[var(--radius-6)] border border-solid border-[var(--color-badge-primary-bg)] bg-[var(--color-drawer-bg)]">
            <div className="flex justify-between border-b border-solid border-[var(--color-border-subtle)] p-[10px]">
              <dt className={cn('font-semibold text-[var(--color-text-secondary)]', labelTwo)}>Total</dt>
              <dd className={cn('m-0 font-semibold text-foreground', labelTwo)}>$12,480.00</dd>
            </div>
            <div className="flex justify-between p-[10px]">
              <dt className={cn('font-semibold text-[var(--color-text-secondary)]', labelTwo)}>Remaining</dt>
              <dd className={cn('m-0 font-semibold text-foreground', labelTwo)}>$0.00</dd>
            </div>
          </dl>
        </DrawerSection>

        <DrawerSection title="Notes & attachments">
          <BaseInput as="textarea" label="Remarks" placeholder="Add any additional notes…" rows={3} />
          <div className="flex flex-wrap items-center gap-[var(--space-12)]">
            <Button variant="link" leadingIcon={<Paperclip size={16} />}>
              Add attachment
            </Button>
            <a href="#" className={cn('text-primary', labelTwo)}>
              brief_v2.pdf
            </a>
            <a href="#" className={cn('text-primary', labelTwo)}>
              specs_final.pdf
            </a>
          </div>
        </DrawerSection>
      </DrawerBody>

      <DrawerFooter>
        <Button variant="link-secondary" onClick={onDismiss}>
          Cancel
        </Button>
        <Button variant="secondary" leadingIcon={<Save size={16} />} onClick={onDismiss}>
          Save draft
        </Button>
        <Button leadingIcon={<Check size={16} />} onClick={onDismiss}>
          Save &amp; submit
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}
