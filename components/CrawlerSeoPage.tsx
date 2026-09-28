import { SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/seo-metadata"
import { SITE_DISPLAY_NAME } from "@/lib/site-url"

export default function CrawlerSeoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-6">
          <img
            src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
            alt={SITE_DISPLAY_NAME}
            width={140}
            height={32}
            className="h-8 w-auto"
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
        <section className="w-full max-w-md" aria-label="Account login">
          <h1 className="text-center text-gray-800 text-2xl font-medium mb-5 tracking-tight">
            {SITE_DISPLAY_NAME}
          </h1>
          <p className="text-center text-gray-600 text-sm mb-4 leading-relaxed">{SITE_DESCRIPTION}</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="UserId"
              disabled
              readOnly
              aria-label="UserId"
              className="w-full rounded border border-gray-300 bg-neutral-50 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              disabled
              readOnly
              aria-label="Password"
              className="w-full rounded border border-gray-300 bg-neutral-50 px-3 py-2 text-sm"
            />
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center py-2 px-6 text-base font-normal min-w-[120px] rounded-none bg-[#010147] text-white border border-[#bec5c2] shadow-[0_0_3px_0_#0066a1] opacity-70"
              >
                Continue
              </button>
              <button
                type="button"
                disabled
                className="inline-flex items-center justify-center py-2 px-6 text-base font-normal min-w-[120px] rounded-none bg-[#010147] text-white border border-[#bec5c2] shadow-[0_0_3px_0_#0066a1] opacity-70"
              >
                Register
              </button>
            </div>
          </div>
        </section>

        {SITE_KEYWORDS.length > 0 ? (
          <section className="mt-8 w-full max-w-4xl border-t border-neutral-200 pt-6">
            <p className="text-sm leading-relaxed text-neutral-600">
              Related searches: {SITE_KEYWORDS.join(", ")}
            </p>
          </section>
        ) : null}
      </main>

      <footer className="bg-gray-200 py-6 px-6 text-center text-xs text-gray-600">
        © {SITE_DISPLAY_NAME}. All Rights Reserved.
      </footer>
    </div>
  )
}
