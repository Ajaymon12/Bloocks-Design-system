// Semantic tokens defined in src/styles/tokens.css. Use the toolbar's theme
// toggle (top of the Storybook UI) to switch this page between light and dark.
const SLOTS = [
  { group: 'Surface', tokens: ['bg', 'bg-subtle', 'surface', 'surface-subtle'] },
  { group: 'Border', tokens: ['border', 'border-strong'] },
  { group: 'Text', tokens: ['text', 'text-secondary', 'text-on-primary'] },
  { group: 'Primary', tokens: ['primary', 'primary-hover', 'primary-active', 'primary-subtle'] },
  { group: 'Success', tokens: ['success', 'success-hover', 'success-subtle'] },
  { group: 'Danger', tokens: ['danger', 'danger-hover', 'danger-subtle'] },
  { group: 'Warning', tokens: ['warning', 'warning-hover', 'warning-subtle'] },
] as const

function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function Swatch({ token }: { token: string }) {
  const varName = `--color-${token}`
  return (
    <div style={{ width: 120 }}>
      <div
        style={{
          height: 56,
          borderRadius: 'var(--radius-8)',
          background: `var(${varName})`,
          border: '1px solid var(--color-border)',
        }}
      />
      <div style={{ fontSize: 12, marginTop: 6 }}>{token}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{readVar(varName)}</div>
    </div>
  )
}

export function ThemeTokens() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: 'var(--color-text)' }}>
      {SLOTS.map(({ group, tokens }) => (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 12px' }}>{group}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
