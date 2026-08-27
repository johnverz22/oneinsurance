---
inclusion: fileMatch
fileMatch: "*/src/components/**/*.tsx"
---
# React & UI Conventions
- Use functional components with typed props interfaces
- Use shadcn/ui components from `@/components/ui/` — don't install alternative UI libraries
- Use Tailwind CSS classes, never inline styles
- Use `cn()` from `@/lib/utils` for conditional class merging
- Toast via `sonner` (`toast.success()`, `toast.error()`)
- Forms: React Hook Form + Zod resolver
