/**
 * Shared Tailwind class strings matching the admin mockup design system.
 * Palette: green #006838 accents, #183d2c text, #5b6e61 muted,
 * #c7d4c9 field/button borders, #dfe7df container borders, #f1f2f0 fills.
 * Controls use rounded-md (never pill-shaped).
 */
export const fieldCls =
  'ui-form-field mt-2 block min-h-11 w-full rounded-md border border-[#c7d4c9] bg-white px-3 py-2 text-sm text-[#183d2c] placeholder-[#9bb09f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] dark:border-[#565c58] dark:bg-[#1c1e1e] dark:text-[#f4f5f2]'

export const labelCls = 'text-base font-semibold text-[var(--text-main)]'

export const btnPrimaryCls =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-[#006838] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00552e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50'

export const btnSecondaryCls =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[#c7d4c9] bg-white px-5 py-2 text-sm font-semibold text-[#183d2c] transition-colors hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#565c58] dark:bg-transparent dark:text-[#f4f5f2] dark:hover:bg-[#303232]'

export const btnOutlineGreenCls =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[#006838] bg-transparent px-4 py-2 text-sm font-semibold text-[#006838] transition-colors hover:bg-[#f1f2f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006838] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#707873] dark:text-[#f4f5f2] dark:hover:bg-[#303232]'

export const btnDangerCls =
  'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50'

export const tableWrapCls =
  'overflow-x-auto rounded-lg border border-[#dfe7df] dark:border-[#3d4140]'

export const tableCls = 'w-full min-w-[650px] text-left text-sm'

export const theadCls =
  'bg-[#f1f2f0] text-xs font-semibold text-[#333] dark:bg-[#303232] dark:text-[#c4c7c5]'

export const thCls = 'px-4 py-3 font-semibold'

export const panelTitleCls =
  'text-xl font-semibold tracking-tight text-[var(--text-main)]'

export const sectionTitleCls = 'text-lg font-semibold text-[var(--text-main)]'
