// Values sourced from Figma: Karbon - AI Accountant, "Space" variable collection
// https://www.figma.com/design/9sL5Vrc6a3NzoLve2o9zgr/Karbon---AI-Accountant?node-id=17097-54020&view=variables
const SPACES = ['0', '1', '2', '4', '8', '10', '12', '14', '16', '20', '24', '28', '32', '40', '48', '60', '72'] as const

export function SpacingTokens() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SPACES.map((value) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, fontSize: 12, color: 'var(--color-text-secondary)' }}>{value}px</div>
          <div
            style={{
              height: 16,
              width: `var(--space-${value})`,
              minWidth: value === '0' ? 1 : undefined,
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-2)',
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{`--space-${value}`}</div>
        </div>
      ))}
    </div>
  )
}
