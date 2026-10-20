import { cn } from '@/lib/utils'
import 'flag-icons/css/flag-icons.min.css'

/**
 * Regional-indicator emoji (🇵🇭) encode the ISO alpha-2 code directly —
 * each char is U+1F1E6..U+1F1FF. Returns 'ph', or null for non-flag emoji
 * (e.g. 🏔️, 🌏, subdivision 🏴… tag sequences).
 */
function emojiToIso(flag: string): string | null {
  const chars = [...flag]
  if (chars.length !== 2) return null
  const letters = chars.map((ch) => {
    const cp = ch.codePointAt(0)!
    return cp >= 0x1f1e6 && cp <= 0x1f1ff
      ? String.fromCharCode(cp - 0x1f1e6 + 97)
      : null
  })
  return letters.every(Boolean) ? letters.join('') : null
}

/**
 * Renders a country flag as an SVG glyph (flag-icons) so it displays
 * correctly on all platforms — Windows has no flag emoji font, so raw
 * regional-indicator emoji degrade to letter pairs ("PH").
 *
 * Accepts the emoji stored in TravelCoverageMap (or a country code);
 * unmappable values fall back to the emoji text itself.
 */
export function CountryFlag({
  flag,
  className,
}: {
  flag?: string
  className?: string
}) {
  const iso = flag ? emojiToIso(flag) : null

  if (!iso) {
    return (
      <span className={cn('inline-block leading-none', className)} aria-hidden>
        {flag || ''}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center justify-center', className)} aria-hidden>
      <span className={`fi fi-${iso} inline-block rounded-[2px]`} />
    </span>
  )
}
