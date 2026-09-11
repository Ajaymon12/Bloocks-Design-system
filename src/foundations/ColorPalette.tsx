import { useState } from 'react'

type ShadeInfo = { hex: string; hsl: string; oklch: string }

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const

// Values as documented in Figma: AIA - Component Library
// https://www.figma.com/design/j6l3kRxBQRNGbf3cwR9NZq/AIA---Component-Library?node-id=54-178
const PALETTE: Record<string, { name: string; primary: string; shades: Record<string, ShadeInfo> }> = {
  blue: {
    name: 'Blue (brand primary)',
    primary: '500',
    shades: {
      '50': { hex: '#F6F7FF', hsl: 'HSL(233, 100%, 98%)', oklch: 'OKLCH(97.8%, 0.011, 280.5)' },
      '100': { hex: '#E2E5FB', hsl: 'HSL(233, 76%, 94%)', oklch: 'OKLCH(92.6%, 0.030, 279.6)' },
      '200': { hex: '#BAC3F4', hsl: 'HSL(231, 73%, 84%)', oklch: 'OKLCH(82.7%, 0.070, 276.6)' },
      '300': { hex: '#7E8EE7', hsl: 'HSL(231, 68%, 70%)', oklch: 'OKLCH(67.2%, 0.133, 274.6)' },
      '400': { hex: '#465ED5', hsl: 'HSL(230, 63%, 55%)', oklch: 'OKLCH(53.2%, 0.184, 270.3)' },
      '500': { hex: '#3146B0', hsl: 'HSL(230, 56%, 44%)', oklch: 'OKLCH(44.5%, 0.170, 269.6)' },
      '600': { hex: '#344593', hsl: 'HSL(229, 48%, 39%)', oklch: 'OKLCH(42.1%, 0.130, 270.7)' },
      '700': { hex: '#35437E', hsl: 'HSL(228, 41%, 35%)', oklch: 'OKLCH(40.2%, 0.100, 271.2)' },
      '800': { hex: '#333F66', hsl: 'HSL(226, 33%, 30%)', oklch: 'OKLCH(37.6%, 0.069, 269.9)' },
      '900': { hex: '#303850', hsl: 'HSL(225, 25%, 25%)', oklch: 'OKLCH(34.4%, 0.044, 269.8)' },
      '950': { hex: '#21263C', hsl: 'HSL(229, 29%, 18%)', oklch: 'OKLCH(27.5%, 0.041, 273.6)' },
    },
  },
  green: {
    name: 'Green (success)',
    primary: '500',
    shades: {
      '50': { hex: '#EFFFEF', hsl: 'HSL(120, 100%, 97%)', oklch: 'OKLCH(98.4%, 0.029, 143.0)' },
      '100': { hex: '#CCF1CB', hsl: 'HSL(118, 58%, 87%)', oklch: 'OKLCH(92.2%, 0.070, 142.0)' },
      '200': { hex: '#A3E1A3', hsl: 'HSL(120, 51%, 76%)', oklch: 'OKLCH(85.2%, 0.117, 142.1)' },
      '300': { hex: '#74CE73', hsl: 'HSL(119, 48%, 63%)', oklch: 'OKLCH(77.3%, 0.170, 141.0)' },
      '400': { hex: '#3EB83C', hsl: 'HSL(119, 51%, 48%)', oklch: 'OKLCH(69.0%, 0.221, 140.0)' },
      '500': { hex: '#03A000', hsl: 'HSL(119, 100%, 31%)', oklch: 'OKLCH(61.2%, 0.238, 139.3)' },
      '600': { hex: '#038501', hsl: 'HSL(119, 99%, 26%)', oklch: 'OKLCH(53.5%, 0.208, 139.3)' },
      '700': { hex: '#036A02', hsl: 'HSL(119, 96%, 21%)', oklch: 'OKLCH(45.5%, 0.176, 139.4)' },
      '800': { hex: '#044E02', hsl: 'HSL(118, 95%, 16%)', oklch: 'OKLCH(36.8%, 0.141, 139.2)' },
      '900': { hex: '#043003', hsl: 'HSL(119, 88%, 10%)', oklch: 'OKLCH(27.0%, 0.098, 139.4)' },
      '950': { hex: '#041804', hsl: 'HSL(120, 71%, 5%)', oklch: 'OKLCH(18.5%, 0.055, 140.4)' },
    },
  },
  red: {
    name: 'Red (danger)',
    primary: '500',
    shades: {
      '50': { hex: '#FFEFEF', hsl: 'HSL(0, 100%, 97%)', oklch: 'OKLCH(96.5%, 0.017, 17.5)' },
      '100': { hex: '#FFCFCF', hsl: 'HSL(0, 100%, 91%)', oklch: 'OKLCH(89.6%, 0.054, 18.2)' },
      // Figma source has a copy-paste error here (duplicates 100's hex); corrected from its own HSL label.
      '200': { hex: '#FEA9A9', hsl: 'HSL(0, 98%, 83%)', oklch: 'OKLCH(82.0%, 0.099, 19.4)' },
      '300': { hex: '#FE7F7F', hsl: 'HSL(0, 98%, 75%)', oklch: 'OKLCH(74.1%, 0.155, 21.5)' },
      '400': { hex: '#FE4D4D', hsl: 'HSL(0, 99%, 65%)', oklch: 'OKLCH(67.1%, 0.214, 25.0)' },
      '500': { hex: '#FD1717', hsl: 'HSL(0, 98%, 54%)', oklch: 'OKLCH(63.0%, 0.250, 28.6)' },
      '600': { hex: '#D21313', hsl: 'HSL(0, 83%, 45%)', oklch: 'OKLCH(54.8%, 0.217, 28.5)' },
      '700': { hex: '#A80F0F', hsl: 'HSL(0, 84%, 36%)', oklch: 'OKLCH(46.5%, 0.183, 27.9)' },
      '800': { hex: '#7D0C0C', hsl: 'HSL(0, 82%, 27%)', oklch: 'OKLCH(37.7%, 0.145, 27.9)' },
      '900': { hex: '#4E0707', hsl: 'HSL(0, 84%, 17%)', oklch: 'OKLCH(27.4%, 0.102, 27.3)' },
      '950': { hex: '#280404', hsl: 'HSL(0, 82%, 9%)', oklch: 'OKLCH(18.4%, 0.062, 25.8)' },
    },
  },
  amber: {
    name: 'Amber (warning; "Yellow / Orange" in Figma)',
    primary: '500',
    shades: {
      '50': { hex: '#FFFAF1', hsl: 'HSL(39, 100%, 97%)', oklch: 'OKLCH(98.4%, 0.021, 89.0)' },
      '100': { hex: '#FFEFC9', hsl: 'HSL(39, 100%, 89%)', oklch: 'OKLCH(95.0%, 0.055, 89.0)' },
      '200': { hex: '#FFE09E', hsl: 'HSL(39, 100%, 81%)', oklch: 'OKLCH(91.0%, 0.095, 85.0)' },
      '300': { hex: '#FFCE6E', hsl: 'HSL(39, 100%, 72%)', oklch: 'OKLCH(86.0%, 0.135, 80.0)' },
      '400': { hex: '#FFB830', hsl: 'HSL(39, 100%, 59%)', oklch: 'OKLCH(80.5%, 0.170, 75.0)' },
      '500': { hex: '#FFA800', hsl: 'HSL(40, 100%, 50%)', oklch: 'OKLCH(77.0%, 0.185, 70.0)' },
      '600': { hex: '#D48C00', hsl: 'HSL(40, 100%, 42%)', oklch: 'OKLCH(66.5%, 0.160, 68.0)' },
      '700': { hex: '#A86F00', hsl: 'HSL(40, 100%, 33%)', oklch: 'OKLCH(56.0%, 0.133, 66.0)' },
      '800': { hex: '#7D5300', hsl: 'HSL(40, 100%, 25%)', oklch: 'OKLCH(45.5%, 0.105, 64.0)' },
      '900': { hex: '#523700', hsl: 'HSL(40, 100%, 16%)', oklch: 'OKLCH(35.0%, 0.075, 62.0)' },
      '950': { hex: '#3D2800', hsl: 'HSL(39, 100%, 12%)', oklch: 'OKLCH(28.5%, 0.058, 60.0)' },
    },
  },
}

const NEUTRAL_SHADES: [string, ShadeInfo][] = [
  ['white', { hex: '#FFFFFF', hsl: 'HSL(0, 0%, 100%)', oklch: 'OKLCH(100.0%, 0.000, 89.9)' }],
  ['50', { hex: '#EFEFEF', hsl: 'HSL(0, 0%, 94%)', oklch: 'OKLCH(95.2%, 0.000, 89.9)' }],
  ['100', { hex: '#E0E0E0', hsl: 'HSL(0, 0%, 88%)', oklch: 'OKLCH(90.7%, 0.000, 89.9)' }],
  ['200', { hex: '#C4C4C4', hsl: 'HSL(0, 0%, 77%)', oklch: 'OKLCH(82.0%, 0.000, 89.9)' }],
  ['300', { hex: '#A8A8A8', hsl: 'HSL(0, 0%, 66%)', oklch: 'OKLCH(73.2%, 0.000, 89.9)' }],
  ['400', { hex: '#8C8C8C', hsl: 'HSL(0, 0%, 55%)', oklch: 'OKLCH(64.0%, 0.000, 89.9)' }],
  ['500', { hex: '#707070', hsl: 'HSL(0, 0%, 44%)', oklch: 'OKLCH(54.5%, 0.000, 89.9)' }],
  ['600', { hex: '#545454', hsl: 'HSL(0, 0%, 33%)', oklch: 'OKLCH(44.6%, 0.000, 89.9)' }],
  ['700', { hex: '#383838', hsl: 'HSL(0, 0%, 22%)', oklch: 'OKLCH(34.1%, 0.000, 89.9)' }],
  ['800', { hex: '#242424', hsl: 'HSL(0, 0%, 14%)', oklch: 'OKLCH(26.0%, 0.000, 89.9)' }],
  ['900', { hex: '#121212', hsl: 'HSL(0, 0%, 7%)', oklch: 'OKLCH(18.2%, 0.000, 89.9)' }],
  ['950', { hex: '#080808', hsl: 'HSL(0, 0%, 3%)', oklch: 'OKLCH(13.4%, 0.000, 89.9)' }],
  ['black', { hex: '#000000', hsl: 'HSL(0, 0%, 0%)', oklch: 'OKLCH(0.0%, 0.000, 0.0)' }],
]

function CopyableValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // clipboard API unavailable (e.g. insecure context); fail silently
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${value}`}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        fontSize: 10,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: copied ? 'var(--color-text)' : 'var(--color-text-secondary)',
        background: 'transparent',
        border: 'none',
        padding: '1px 0',
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied!' : value}
    </button>
  )
}

function Swatch({
  token,
  label,
  info,
  badge,
}: {
  token: string
  label: string
  info: ShadeInfo
  badge?: string
}) {
  return (
    <div style={{ width: 140 }}>
      <div
        style={{
          height: 90,
          borderRadius: 8,
          background: `var(${token})`,
          border: '1px solid var(--color-border)',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 999,
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 999,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ marginTop: 6 }}>
        <CopyableValue value={info.hex} />
        <CopyableValue value={info.hsl} />
        <CopyableValue value={info.oklch} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{token}</div>
    </div>
  )
}

export function ColorPalette() {
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      {Object.entries(PALETTE).map(([prefix, family]) => (
        <div key={prefix} style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 12px' }}>{family.name}</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {SHADES.map((shade) => (
              <Swatch
                key={shade}
                token={`--palette-${prefix}-${shade}`}
                label={shade}
                info={family.shades[shade]}
                badge={shade === family.primary ? 'primary' : undefined}
              />
            ))}
          </div>
        </div>
      ))}

      <div>
        <h3 style={{ margin: '0 0 12px' }}>Neutral (grayscale)</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {NEUTRAL_SHADES.map(([shade, info]) => (
            <Swatch
              key={shade}
              token={`--palette-neutral-${shade === 'white' ? '0' : shade === 'black' ? '1000' : shade}`}
              label={shade}
              info={info}
              badge={shade === '50' ? 'anchor' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
