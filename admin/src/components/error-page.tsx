import Link from 'next/link'

const SUPPORT_EMAIL = 'sales@ifrcinsurance.com'

/**
 * Shared error page layout (mockups `error-404` / `error-500`).
 * Open centred layout: no enclosing card, no icon, no alarm colours. The
 * large status code is the only visual. Copy is passed in by the route.
 */
export function ErrorPage({
  code,
  heading,
  description,
}: {
  code: number
  heading: string
  description: string
}) {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col bg-[#fcfdfb] text-[var(--text-main)] dark:bg-[#1c1e1e]"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-8 sm:py-20">
        <p className="text-[clamp(6rem,16vw,10rem)] font-semibold leading-none tracking-tight text-[#006838] dark:text-[#d0e3c8]">
          {code}
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[var(--text-main)] sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-sub)]">
          {description}
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="btn-primary">
            Back to home
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-secondary">
            Get in touch
          </a>
        </div>
        <p className="mt-8 text-base leading-relaxed text-[var(--text-sub)]">
          Need a hand?{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-[#006838] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#006838] dark:text-[#d0e3c8] dark:focus-visible:outline-[#d0e3c8]"
          >
            Our team is here to help.
          </a>
        </p>
      </div>
    </main>
  )
}
