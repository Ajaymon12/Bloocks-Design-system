import type { ReactNode } from 'react'
import pkg from '../../package.json'

// Header for the Introduction page (Introduction.mdx). The rest of that page is plain Markdown so
// it's easy to edit. Storybook paints docs pages white in both themes, so this uses fixed palette
// values rather than semantic tokens, which would flip to dark colors on a white page.

function Logo() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <rect x="4" y="30" width="22" height="22" rx="5" fill="var(--palette-blue-500)" />
      <rect x="30" y="30" width="22" height="22" rx="5" fill="var(--palette-blue-300)" />
      <rect x="17" y="4" width="22" height="22" rx="5" fill="var(--palette-blue-400)" />
    </svg>
  )
}

function Shield({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'amber' }) {
  const valueBg = tone === 'amber' ? 'var(--palette-amber-500)' : 'var(--palette-blue-500)'
  const valueText = tone === 'amber' ? 'var(--palette-neutral-900)' : 'var(--palette-neutral-0)'
  return (
    <span
      style={{
        display: 'inline-flex',
        overflow: 'hidden',
        borderRadius: 'var(--radius-4)',
        fontSize: 'var(--text-caption-1-size)',
        lineHeight: 'var(--text-caption-1-line-height)',
        fontWeight: 'var(--font-weight-semibold)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ padding: '6px 8px', background: 'var(--palette-blue-950)', color: 'var(--palette-neutral-0)' }}>
        {label}
      </span>
      <span style={{ padding: '6px 8px', background: valueBg, color: valueText }}>{value}</span>
    </span>
  )
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-8)' }}>{children}</div>
  )
}

export function IntroHeader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-24)',
        paddingBlock: 'var(--space-16) var(--space-32)',
        fontFamily: 'var(--font-family-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
        <Logo />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 'var(--text-h3-size)',
              lineHeight: 'var(--text-h3-line-height)',
              letterSpacing: 'var(--text-h3-letter-spacing)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--palette-blue-950)',
            }}
          >
            bloocks
          </span>
          <span
            style={{
              fontSize: 'var(--text-label-3-size)',
              lineHeight: 'var(--text-label-3-line-height)',
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              color: 'var(--palette-blue-500)',
            }}
          >
            Design system
          </span>
        </div>
      </div>
      <Row>
        <Shield label="Version" value={`v${pkg.version}`} />
        <Shield label="React" value={pkg.dependencies.react.replace(/^\^/, '').split('.')[0]} />
        <Shield label="Tailwind" value={pkg.dependencies.tailwindcss.replace(/^\^/, '').split('.')[0]} />
        <Shield label="Status" value="In development" tone="amber" />
      </Row>
    </div>
  )
}
