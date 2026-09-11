import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  [
    'inline-flex items-center justify-center box-border border-0',
    'rounded-[var(--radius-4)] font-[family-name:var(--font-family-primary)] font-medium',
    'whitespace-nowrap',
  ],
  {
    variants: {
      // Named after Blade's color vocabulary (positive/negative/notice/information/neutral/
      // primary) rather than this project's own success/danger/warning — Badge's color prop
      // deliberately mirrors Blade's Badge API. See tokens.css for the --color-badge-* mapping.
      color: {
        neutral: 'bg-[var(--color-badge-neutral-bg)] text-[var(--color-badge-neutral-text)]',
        primary: 'bg-[var(--color-badge-primary-bg)] text-[var(--color-badge-primary-text)]',
        positive: 'bg-[var(--color-badge-positive-bg)] text-[var(--color-badge-positive-text)]',
        negative: 'bg-[var(--color-badge-negative-bg)] text-[var(--color-badge-negative-text)]',
        notice: 'bg-[var(--color-badge-notice-bg)] text-[var(--color-badge-notice-text)]',
        // No distinct Figma spec yet — aliased to primary's exact token values (see tokens.css).
        information: 'bg-[var(--color-badge-information-bg)] text-[var(--color-badge-information-text)]',
      },
      size: {
        // sm is the only Figma-confirmed size (padding 4px 8px, gap 4px, height 20px, caption-1
        // text 10/12). md/lg are proposed extrapolations up the type scale — not Figma-confirmed.
        sm: 'gap-[var(--space-4)] px-[var(--space-8)] py-[var(--space-4)] text-[length:var(--text-caption-1-size)] leading-[var(--text-caption-1-line-height)] tracking-[var(--text-caption-1-letter-spacing)]',
        md: 'gap-[var(--space-4)] px-[var(--space-8)] py-[var(--space-4)] text-[length:var(--text-label-3-size)] leading-[var(--text-label-3-line-height)] tracking-[var(--text-label-3-letter-spacing)]',
        lg: 'gap-[var(--space-4)] px-[var(--space-10)] py-[var(--space-4)] text-[length:var(--text-label-2-size)] leading-[var(--text-label-2-line-height)] tracking-[var(--text-label-2-letter-spacing)]',
      },
    },
    defaultVariants: {
      color: 'neutral',
      size: 'sm',
    },
  },
)
