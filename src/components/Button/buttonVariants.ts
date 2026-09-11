import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-[var(--space-4)] box-border border-0',
    'rounded-[var(--radius-6)] font-[family-name:var(--font-family-primary)] font-medium',
    'whitespace-nowrap no-underline cursor-pointer',
    'transition-[background-color,color,border-color,opacity] duration-150 ease-in-out',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]',
        secondary:
          'bg-[var(--color-primary-subtle)] text-primary hover:bg-[color-mix(in_srgb,var(--color-primary-subtle),var(--color-primary)_15%)]',
        outline: 'bg-[var(--color-surface)] text-foreground border border-border hover:bg-[var(--color-bg-subtle)]',
        ghost: 'bg-transparent text-primary hover:bg-[var(--color-primary-subtle)]',
        link: 'bg-transparent p-0 rounded-none h-auto text-primary hover:underline',
        'link-secondary': 'bg-transparent p-0 rounded-none h-auto text-[var(--color-text-secondary)] hover:underline',
      },
      size: {
        // xss/xs have no standalone text-button spec in Figma — meaningful only as icon-only
        // sizes (see the iconOnly compound variants below).
        xss: '',
        xs: '',
        // md/sm share the same padding rhythm; only the type scale changes, matching the real
        // px math from Figma: 8 (padding) + 20 (line-height) + 8 (padding) = 36px for md,
        // 8 + 16 + 8 = 32px for sm.
        sm: 'px-[var(--space-12)] py-[var(--space-8)] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] tracking-[var(--text-label-3-letter-spacing)]',
        md: 'px-[var(--space-12)] py-[var(--space-8)] text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)]',
      },
      isDestructive: {
        true: '',
        false: '',
      },
      isFullWidth: {
        true: 'w-full',
        false: '',
      },
      iconOnly: {
        true: 'p-0',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'primary', isDestructive: true, class: 'bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]' },
      {
        variant: 'secondary',
        isDestructive: true,
        class:
          'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger-subtle),var(--color-danger)_15%)]',
      },
      {
        variant: 'outline',
        isDestructive: true,
        class: 'text-[var(--color-danger)] border-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]',
      },
      { variant: 'ghost', isDestructive: true, class: 'text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]' },
      { variant: 'link', isDestructive: true, class: 'text-[var(--color-danger)]' },
      { variant: 'link-secondary', isDestructive: true, class: 'text-[var(--color-danger)]' },
      // Icon-only — fixed squares, height-matched to the text button at that size (36/32/28/20px)
      // rather than Figma's standalone Icon Button spec, so an icon-only button sits flush next
      // to a text button (e.g. a ButtonGroup dropdown trigger).
      { iconOnly: true, size: 'md', class: 'w-9 h-9' },
      { iconOnly: true, size: 'sm', class: 'w-8 h-8' },
      { iconOnly: true, size: 'xs', class: 'w-7 h-7' },
      { iconOnly: true, size: 'xss', class: 'w-5 h-5' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      isDestructive: false,
      isFullWidth: false,
      iconOnly: false,
    },
  },
)
