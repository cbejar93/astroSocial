import React from "react";

const shimmer = "bg-white/10";

const Pill = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-full ${shimmer} ${className}`} />
);

const CardShell = ({ className = "", children }: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={`rounded-[24px] bg-slate-900/50 ring-1 ring-white/10 shadow-[0_18px_60px_rgba(2,6,23,.45)] ${className}`}
  >
    {children}
  </div>
);

const ForecastCardSkeleton = () => (
  <CardShell className="flex-shrink-0 min-w-[320px] max-w-[420px] p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Pill className="h-4 w-24" />
      <Pill className="h-4 w-16" />
    </div>
    <Pill className="h-8 w-28" />
    <div className="flex gap-2">
      <Pill className="h-10 w-10 rounded-2xl" />
      <Pill className="h-10 w-full" />
    </div>
    <Pill className="h-2.5 w-full" />
    <Pill className="h-2.5 w-11/12" />
  </CardShell>
);

const SecondaryCardSkeleton = () => (
  <CardShell className="p-5 h-full space-y-4">
    <Pill className="h-4 w-1/3" />
    <Pill className="h-8 w-2/3" />
    <div className="space-y-2">
      <Pill className="h-3 w-full" />
      <Pill className="h-3 w-5/6" />
      <Pill className="h-3 w-4/6" />
    </div>
  </CardShell>
);

const WeatherSkeleton = () => {
  return (
    <div className="relative overflow-x-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-12%] h-[42vh] w-[70vw] -translate-x-1/2 rounded-[999px] bg-gradient-to-br from-sky-500/15 via-fuchsia-500/10 to-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 bottom-[-20%] translate-x-1/4 sm:translate-x-0 h-[36vh] w-[80vw] rounded-[999px] bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-transparent blur-3xl" />
      </div>

      <div className="w-full flex justify-center">
        <div className="w-full lg:min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)] lg:gap-8">
          <div className="lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:justify-center">
            <div
              className="lg:max-h-[78vh] lg:overflow-y-auto lg:overscroll-contain [scrollbar-gutter:stable] pr-0 scrollbar-cute"
            >
              <div className="flex flex-col space-y-4 lg:space-y-0">
                {/* current conditions */}
                <div className="relative w-full max-w-[860px] mx-auto animate-pulse">
                  <div className="absolute inset-0 -z-10 overflow-hidden rounded-[24px]">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[40vh] w-[75vw] rounded-full bg-gradient-to-br from-[#6f4cff]/18 via-[#a855f7]/14 to-[#10b981]/18 blur-[72px]" />
                    <div className="absolute -bottom-24 -right-16 h-[30vh] w-[40vw] rounded-full bg-gradient-to-tr from-[#10b981]/15 via-[#38bdf8]/15 to-transparent blur-[70px]" />
                  </div>
                  <CardShell className="p-5 sm:p-6 lg:p-7">
                    <div className="flex justify-end">
                      <Pill className="h-5 w-16" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-4">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <Pill className="h-6 w-1/2" />
                          <Pill className="h-4 w-1/3" />
                        </div>
                        <div className="flex gap-4">
                          <Pill className="h-4 w-24" />
                          <Pill className="h-4 w-24" />
                        </div>
                        <div className="space-y-3">
                          <Pill className="h-12 w-1/3" />
                          <Pill className="h-8 w-1/4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <Pill className="h-32 w-32 rounded-full" />
                      </div>
                    </div>
                  </CardShell>
                </div>

                {/* mobile forecast scroller */}
                <section aria-hidden="true" className="lg:hidden animate-pulse">
                  <div className="-mx-6 overflow-x-auto snap-x snap-mandatory [scrollbar-gutter:stable] scrollbar-cute">
                    <div className="flex gap-3 pr-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex-shrink-0 min-w-[320px] max-w-[420px] snap-start">
                          <ForecastCardSkeleton />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* secondary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch lg:mt-6 animate-pulse">
                  <SecondaryCardSkeleton />
                  <SecondaryCardSkeleton />
                  <CardShell className="sm:col-span-2 p-5 space-y-4">
                    <Pill className="h-4 w-40" />
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <Pill key={idx} className="h-3 w-full" />
                      ))}
                    </div>
                    <Pill className="h-48 w-full rounded-2xl" />
                  </CardShell>
                </div>
              </div>
            </div>
          </div>

          {/* desktop aside */}
          <aside className="hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-center animate-pulse">
            <div
              className="relative max-h-[78vh] overflow-y-auto overscroll-contain rounded-2xl bg-slate-900/30 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.04),0_10px_30px_rgba(2,6,23,.35)] p-3 pr-3 w-full [scrollbar-gutter:stable_both-edges] scrollbar-cute"
            >
              <div className="flex flex-col gap-3 pr-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ForecastCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WeatherSkeleton;
