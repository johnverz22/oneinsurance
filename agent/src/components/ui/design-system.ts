/**
 * Design System — Agent Portal
 *
 * Central export for all shared UI components.
 * Import from here to keep things consistent:
 *
 *   import { StatusBadge, StatCard, PillTabs, SectionCard, PolicyBadge } from '@/components/ui/design-system'
 */

// Status badges (ACTIVE, COMPLETED, PENDING, etc.)
export { StatusBadge } from './status-badge'

// Metric stat cards with colored top bar
export { StatCard, StatCardSkeleton, StatCardsGrid, STAT_COLORS } from './stat-card'
export type { StatColorIndex } from './stat-card'

// Pill-style tab buttons
export { PillTabs, PillLinkTabs } from './pill-tabs'

// Section card wrapper (header + flush table + footer)
export { SectionCard, SectionCardHeader, SectionCardContent, SectionCardFooter } from './section-card'

// Policy number badge + gold action link
export { PolicyBadge, GoldActionLink } from './policy-badge'

// Pagination bar (connected to table, matches DataTable style)
export { PaginationBar } from './pagination-bar'
