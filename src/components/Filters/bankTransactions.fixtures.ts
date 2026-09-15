import type { FilterField, FilterOption, FilterOptionsLoader } from './types'

// Story-only data for the Filters components: bank transactions carrying every field the first use
// needs (Bank ledger, Account type, Bank name, a real posted Date), plus fake async loaders whose
// behaviour a story can pin (ok / empty / error / never resolves).

/** Pinned, not `new Date()` — date presets are reckoned from today, so a clock-derived value would
 * make assertions drift daily and flake across midnight. Tuesday 15 Sep 2026. */
export const FILTERS_TODAY = new Date(2026, 8, 15)

export const BANK_OPTIONS: FilterOption[] = [
  { value: 'bank_hdfc', label: 'HDFC Bank' },
  { value: 'bank_icici', label: 'ICICI Bank' },
  { value: 'bank_sbi', label: 'State Bank of India' },
  { value: 'bank_axis', label: 'Axis Bank' },
  { value: 'bank_kotak', label: 'Kotak Mahindra Bank' },
]

export const ACCOUNT_TYPE_OPTIONS: FilterOption[] = [
  { value: 'current', label: 'Current' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'overdraft', label: 'Overdraft' },
  { value: 'cash_credit', label: 'Cash credit' },
]

type BankLedgerRecord = { id: string; name: string; bankId: string; accountType: string }

const BANK_LEDGER_RECORDS: BankLedgerRecord[] = [
  { id: 'l_hdfc_current', name: 'HDFC Current A/c - 4521', bankId: 'bank_hdfc', accountType: 'current' },
  { id: 'l_hdfc_savings', name: 'HDFC Savings A/c - 1180', bankId: 'bank_hdfc', accountType: 'savings' },
  { id: 'l_icici_savings', name: 'ICICI Savings A/c - 2210', bankId: 'bank_icici', accountType: 'savings' },
  { id: 'l_icici_card', name: 'ICICI Credit Card A/c - 9876', bankId: 'bank_icici', accountType: 'credit_card' },
  { id: 'l_sbi_cc', name: 'SBI Cash Credit A/c - 3304', bankId: 'bank_sbi', accountType: 'cash_credit' },
  { id: 'l_sbi_current', name: 'SBI Current A/c - 7702', bankId: 'bank_sbi', accountType: 'current' },
  { id: 'l_axis_od', name: 'Axis Overdraft A/c - 5518', bankId: 'bank_axis', accountType: 'overdraft' },
  { id: 'l_kotak_current', name: 'Kotak Current A/c - 6630', bankId: 'bank_kotak', accountType: 'current' },
]

export const BANK_LEDGER_OPTIONS: FilterOption[] = BANK_LEDGER_RECORDS.map((record) => ({
  value: record.id,
  label: record.name,
}))

export type BankTransaction = {
  id: string
  postedOn: Date
  narration: string
  bankLedgerId: string
  bankId: string
  accountType: string
  amount: number
}

function transaction(id: string, postedOn: Date, narration: string, ledgerId: string, amount: number): BankTransaction {
  const ledger = BANK_LEDGER_RECORDS.find((record) => record.id === ledgerId) as BankLedgerRecord
  return { id, postedOn, narration, bankLedgerId: ledger.id, bankId: ledger.bankId, accountType: ledger.accountType, amount }
}

/** Dates are spread so each preset matches a known set: this week (13–15 Sep), this month, last month
 * (Aug), this FY (from 1 Apr 2026) and last FY (Apr 2025 – Mar 2026). Savings rows: 3. */
export const BANK_TRANSACTIONS: BankTransaction[] = [
  transaction('t01', new Date(2026, 8, 15), 'UPI collection', 'l_hdfc_current', 12500),
  transaction('t02', new Date(2026, 8, 14), 'NEFT to vendor', 'l_icici_savings', -48000),
  transaction('t03', new Date(2026, 8, 13), 'Card spend — cloud hosting', 'l_icici_card', -9200),
  transaction('t04', new Date(2026, 8, 10), 'Interest debit', 'l_sbi_cc', -3100),
  transaction('t05', new Date(2026, 8, 2), 'OD renewal fee', 'l_axis_od', -1500),
  transaction('t06', new Date(2026, 7, 28), 'Customer receipt', 'l_kotak_current', 76000),
  transaction('t07', new Date(2026, 7, 20), 'Sweep in', 'l_hdfc_savings', 20000),
  transaction('t08', new Date(2026, 7, 5), 'GST payment', 'l_sbi_current', -18400),
  transaction('t09', new Date(2026, 6, 18), 'Salary payout', 'l_hdfc_current', -240000),
  transaction('t10', new Date(2026, 5, 2), 'FD interest', 'l_icici_savings', 5400),
  transaction('t11', new Date(2026, 3, 10), 'Loan disbursal', 'l_axis_od', 150000),
  transaction('t12', new Date(2026, 2, 20), 'Year-end TDS', 'l_kotak_current', -12000),
  transaction('t13', new Date(2026, 1, 15), 'Bank charges', 'l_hdfc_current', -590),
  transaction('t14', new Date(2025, 10, 11), 'Stock purchase', 'l_sbi_cc', -64000),
]

export function labelOf(options: FilterOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

export type FakeLoaderMode = 'ok' | 'empty' | 'error' | 'pending'

/** A `loadOptions` stand-in. `calls` records every query, so a story can assert a Retry refetched. */
export function createFakeLoader(
  options: FilterOption[],
  { delayMs = 120, mode = 'ok' }: { delayMs?: number; mode?: FakeLoaderMode } = {},
): FilterOptionsLoader & { calls: string[] } {
  const calls: string[] = []
  const load: FilterOptionsLoader = (query, { signal }) => {
    calls.push(query)
    return new Promise<FilterOption[]>((resolve, reject) => {
      if (mode === 'pending') return
      const timer = setTimeout(() => {
        if (mode === 'error') {
          reject(new Error('Network error'))
          return
        }
        if (mode === 'empty') {
          resolve([])
          return
        }
        const needle = query.toLowerCase()
        resolve(options.filter((option) => option.label.toLowerCase().includes(needle)))
      }, delayMs)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })
  }
  return Object.assign(load, { calls })
}

export function createFakeResolver(options: FilterOption[]) {
  return (values: string[]) => Promise.resolve(options.filter((option) => values.includes(option.value)))
}

/** The four bank filters. Only Bank ledger is a quick-filter chip; the rest live in All filters and
 * get a chip once active. */
export function bankFilterFields({
  bankLedgerLoader = createFakeLoader(BANK_LEDGER_OPTIONS),
  bankLoader = createFakeLoader(BANK_OPTIONS),
}: { bankLedgerLoader?: FilterOptionsLoader; bankLoader?: FilterOptionsLoader } = {}): FilterField[] {
  return [
    {
      key: 'bankLedger',
      label: 'Bank ledger',
      type: 'entity_ref',
      quickFilter: true,
      columnId: 'bankLedgerId',
      loadOptions: bankLedgerLoader,
      resolveOptions: createFakeResolver(BANK_LEDGER_OPTIONS),
    },
    { key: 'accountType', label: 'Account type', type: 'enum', columnId: 'accountType', options: ACCOUNT_TYPE_OPTIONS },
    {
      key: 'bankName',
      label: 'Bank name',
      type: 'entity_ref',
      columnId: 'bankId',
      loadOptions: bankLoader,
      resolveOptions: createFakeResolver(BANK_OPTIONS),
    },
    { key: 'date', label: 'Date', type: 'date', columnId: 'postedOn', maxDate: FILTERS_TODAY },
  ]
}

// --- The sample panel's fields (Status / Source / Accepted by) --------------------------------

export const STATUS_FIELD: FilterField = {
  key: 'status',
  label: 'Status',
  type: 'enum',
  options: [
    { value: 'reconciled', label: 'Reconciled', color: 'positive' },
    { value: 'unreconciled', label: 'Unreconciled', color: 'negative' },
    { value: 'partially_reconciled', label: 'Partially reconciled', color: 'information' },
    { value: 'pending_review', label: 'Pending review', color: 'notice' },
    { value: 'excluded', label: 'Excluded', color: 'neutral' },
  ],
}

export const SOURCE_FIELD: FilterField = {
  key: 'source',
  label: 'Source',
  type: 'enum',
  options: [
    { value: 'bank_feed', label: 'Bank feed' },
    { value: 'statement_upload', label: 'Statement upload' },
    { value: 'manual', label: 'Manual entry' },
  ],
}

const USER_OPTIONS: FilterOption[] = [
  { value: 'u_asha', label: 'Asha Menon' },
  { value: 'u_rahul', label: 'Rahul Verma' },
  { value: 'u_priya', label: 'Priya Nair' },
]

export const ACCEPTED_BY_FIELD: FilterField = {
  key: 'acceptedBy',
  label: 'Accepted by',
  type: 'entity_ref',
  loadOptions: createFakeLoader(USER_OPTIONS),
}

/** Ten options — past the search threshold, so this checklist gets a search box. */
export const VOUCHER_TYPE_FIELD: FilterField = {
  key: 'voucherType',
  label: 'Voucher type',
  type: 'enum',
  options: ['Payment', 'Receipt', 'Contra', 'Journal', 'Sales', 'Purchase', 'Debit note', 'Credit note', 'Memo', 'Reversing'].map(
    (label) => ({ value: label.toLowerCase().replace(/\s+/g, '_'), label }),
  ),
}
