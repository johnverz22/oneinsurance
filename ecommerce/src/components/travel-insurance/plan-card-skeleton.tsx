export function PlanCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="travel-plan-card w-full animate-pulse select-none"
    >
      <div className="travel-plan-card__summary w-full">
        <div className="travel-plan-card__info min-w-0">
          <p className="travel-provider-name max-sm:hidden">
            <span className="inline-block h-3.5 w-24 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </p>

          <div className="travel-compare-choice pointer-events-none">
            <span className="inline-block size-4 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
            <span className="inline-block h-3.5 w-12 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </div>

          <h2 className="travel-plan-title">
            <span className="inline-block h-5 sm:h-6 w-3/4 max-w-sm rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </h2>

          <div className="travel-plan-benefits">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="travel-plan-benefit">
                <div className="size-5 shrink-0 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-16 max-w-full rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
                  <div className="mt-1 sm:mt-1.5 h-3 w-20 max-w-full rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="travel-plan-price">
          <div className="travel-insurer-logo !bg-transparent dark:!bg-transparent border-0 !p-0">
            <div className="h-6 w-24 sm:h-9 sm:w-32 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </div>
          <p>
            <span className="inline-block h-7 w-28 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </p>
          <span className="travel-plan-total block">
            <span className="inline-block h-3.5 w-24 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
          </span>
          <div className="travel-apply !bg-[#dfe7df] dark:!bg-[#3d4140] pointer-events-none border-0 w-full" />
        </div>
      </div>

      <div className="travel-benefits-toggle pointer-events-none w-full">
        <div className="mx-auto h-4 w-36 rounded bg-[#dfe7df] dark:bg-[#3d4140]" />
      </div>
    </div>
  )
}
