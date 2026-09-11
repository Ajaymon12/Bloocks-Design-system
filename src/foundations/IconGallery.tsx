import { useMemo, useState } from 'react'
import { icons } from 'lucide-react'
import { USED_ICONS } from './usedIcons'

const ICON_NAMES = Object.keys(icons).sort()

export function IconGallery() {
  const [query, setQuery] = useState('')
  const [usedOnly, setUsedOnly] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ICON_NAMES.filter((name) => {
      if (usedOnly && !USED_ICONS[name]) return false
      if (q && !name.toLowerCase().includes(q)) return false
      return true
    })
  }, [query, usedOnly])

  const handleCopy = (name: string) => {
    navigator.clipboard?.writeText(name)
    setCopied(name)
    window.setTimeout(() => setCopied((current) => (current === name ? null : current)), 1200)
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: 'var(--color-text)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-16)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search icons…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            width: '100%',
            maxWidth: 320,
            padding: 'var(--space-8) var(--space-12)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-body-3-size)',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-6)',
          }}
        />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-8)',
            fontSize: 'var(--text-body-3-size)',
            color: 'var(--color-text)',
            cursor: 'pointer',
          }}
        >
          <input type="checkbox" checked={usedOnly} onChange={(event) => setUsedOnly(event.target.checked)} />
          Used in this project only ({Object.keys(USED_ICONS).length})
        </label>
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)',
          margin: 'var(--space-16) 0',
        }}
      >
        {filtered.length} of {ICON_NAMES.length} icons — click one to copy its import name. When a
        component needs an icon, pick it from here rather than reaching for a different icon set.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 'var(--space-8)',
        }}
      >
        {filtered.map((name) => {
          const Icon = icons[name as keyof typeof icons]
          const usedBy = USED_ICONS[name]
          return (
            <button
              key={name}
              type="button"
              onClick={() => handleCopy(name)}
              title={usedBy ? `${name} — used in ${usedBy.join(', ')}` : name}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-8)',
                padding: 'var(--space-12) var(--space-4)',
                background: copied === name ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                border: `1px solid ${usedBy ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-6)',
                cursor: 'pointer',
              }}
            >
              {usedBy && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                  }}
                  aria-hidden="true"
                />
              )}
              <Icon size={20} color="var(--color-text)" />
              <span
                style={{
                  fontSize: 10,
                  color: copied === name ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {copied === name ? 'Copied!' : name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
