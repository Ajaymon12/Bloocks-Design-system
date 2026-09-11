// Values sourced from Figma: Karbon - AI Accountant, "Typography" variable collection
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=17097-54020&view=variables
const WEIGHTS = [
  ['Thin', '100'],
  ['ExtraLight', '200'],
  ['Light', '300'],
  ['Regular', '400'],
  ['Medium', '500'],
  ['SemiBold', '600'],
  ['Bold', '700'],
  ['ExtraBold', '800'],
  ['Black', '900'],
] as const

const SCALE_GROUPS: { group: string; styles: string[] }[] = [
  { group: 'Title', styles: ['title-1', 'title-2', 'title-3'] },
  { group: 'Heading', styles: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { group: 'Label', styles: ['label-1', 'label-2', 'label-3'] },
  { group: 'Body', styles: ['body-1', 'body-2', 'body-3', 'body-4'] },
  { group: 'Caption', styles: ['caption-1', 'caption-2'] },
]

const SAMPLE = 'The quick brown fox jumps over the lazy dog'

// Reads the real resolved value from tokens.css, so this page can never drift from it.
function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function TypeRow({ group, style }: { group: string; style: string }) {
  const size = readVar(`--text-${style}-size`)
  const lineHeight = readVar(`--text-${style}-line-height`)
  const letterSpacing = readVar(`--text-${style}-letter-spacing`)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 24,
        padding: '16px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ width: 140, flexShrink: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <div style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{group}</div>
        <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{style}</div>
        <div style={{ marginTop: 4 }}>{`${size} / ${lineHeight} / ${letterSpacing}`}</div>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontWeight: 'var(--font-weight-regular)' as unknown as number,
          fontSize: `var(--text-${style}-size)`,
          lineHeight: `var(--text-${style}-line-height)`,
          letterSpacing: `var(--text-${style}-letter-spacing)`,
          color: 'var(--color-text)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {SAMPLE}
      </div>
    </div>
  )
}

export function TypographyTokens() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: 'var(--color-text)' }}>
      <h3 style={{ margin: '0 0 4px' }}>Font family</h3>
      <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 18, margin: '0 0 24px' }}>
        Open Sans — var(--font-family-primary)
      </p>

      <h3 style={{ margin: '0 0 12px' }}>Weights</h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        {WEIGHTS.map(([name, value]) => (
          <div key={name} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontWeight: value as unknown as number,
                fontSize: 28,
              }}
            >
              Aa
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '0 0 4px' }}>Type scale</h3>
      <div>
        {SCALE_GROUPS.flatMap(({ group, styles }) =>
          styles.map((style) => <TypeRow key={style} group={group} style={style} />)
        )}
      </div>
    </div>
  )
}
