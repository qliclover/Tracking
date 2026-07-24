/**
 * The Margin mark: a ledger "margin rule" — a vertical accent line with three
 * text-like strokes beside it. Colors come from CSS vars so it adapts to theme.
 */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="logo" aria-hidden="true">
      <rect className="logo-sq" width="100" height="100" rx="24" />
      <line className="logo-rule" x1="37" y1="26" x2="37" y2="74" strokeWidth="6" strokeLinecap="round" />
      <line className="logo-line" x1="49" y1="38" x2="76" y2="38" strokeWidth="6" strokeLinecap="round" />
      <line className="logo-line" x1="49" y1="52" x2="76" y2="52" strokeWidth="6" strokeLinecap="round" />
      <line className="logo-line-2" x1="49" y1="66" x2="66" y2="66" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}
