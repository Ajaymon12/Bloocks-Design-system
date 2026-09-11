// Values sourced from Figma: Karbon - AI Accountant, "Border" variable collection
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=17097-54020&view=variables
const RADII = ['0', '2', '4', '6', '8', '12', '16', '24', '32', '48'] as const

export function BorderTokens() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {RADII.map((value) => (
        <div key={value} style={{ width: 100 }}>
          <div
            style={{
              height: 80,
              background: 'var(--color-primary-subtle)',
              border: '2px solid var(--color-primary)',
              borderRadius: `var(--radius-${value})`,
            }}
          />
          <div style={{ fontSize: 12, marginTop: 6 }}>{value}px</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>--radius-{value}</div>
        </div>
      ))}
    </div>
  )
}
