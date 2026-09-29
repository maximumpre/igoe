import Link from "next/link"
import { SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/seo-metadata"
import { GOIGOE_HANDSHAKE_URL } from "@/lib/auth-redirect"
import { SITE_DISPLAY_NAME } from "@/lib/site-url"

const FORGOT_USERNAME_URL = `${new URL(GOIGOE_HANDSHAKE_URL).origin}/Authentication/UserNameRetrieval`
const FORGOT_PASSWORD_URL = `${new URL(GOIGOE_HANDSHAKE_URL).origin}/Page/ForgotPassword`

/**
 * Server-rendered lookalike of the human landing at app/page.tsx, served to
 * allowed crawler UAs so they index real H1 / description / body keywords
 * instead of a generic stub.
 *
 * Twin rules (Steins Gate `SEO_CRAWLER_RULES.md`):
 * - Static server component only. No "use client", no working submit handlers.
 * - Header -> login (H1 + form) -> "Related searches:" -> footer.
 * - Keywords must be visible body text, not meta-only, not sr-only/display:none.
 * - Desktop and mobile must match the human landing shell — the copy, order,
 *   field labels and button chrome below are kept in lockstep with app/page.tsx.
 */
export default function CrawlerSeoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
              alt={SITE_DISPLAY_NAME}
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-4 md:pt-10 pb-8 lg:pr-[700px]">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-2 border-gray-400 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mb-4 leading-relaxed">
            We will maintain the confidentiality of your personal information in
            accordance with our privacy policy.
          </p>

          <h1 className="text-center text-gray-800 text-2xl font-medium mb-5 tracking-tight">
            {SITE_DISPLAY_NAME}
          </h1>

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="crawler-userId" className="text-sm font-medium text-gray-700">
                UserId <span className="text-orange-500">*</span>
              </label>
              <input
                id="crawler-userId"
                name="UserId"
                type="text"
                placeholder="UserId"
                disabled
                readOnly
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm opacity-70"
              />
              <p className="text-sm mt-1">
                <span className="text-gray-600">Forgot your Username? </span>
                <Link href={FORGOT_USERNAME_URL} className="text-blue-600">
                  Let us help
                </Link>
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="crawler-password" className="text-sm font-medium text-gray-700">
                Password <span className="text-orange-500">*</span>
              </label>
              <input
                id="crawler-password"
                name="Password"
                type="password"
                placeholder="Password"
                disabled
                readOnly
                className="w-full border border-gray-300 bg-white px-3 py-2 text-sm opacity-70"
              />
              <p className="text-sm mt-1">
                <span className="text-gray-600">Forgot your Password? </span>
                <Link href={FORGOT_PASSWORD_URL} className="text-blue-600">
                  Let us help
                </Link>
              </p>
            </div>

            <div className="flex justify-center md:justify-start">
              <button
                type="button"
                disabled
                className="py-2 px-6 text-base font-normal min-w-[120px] cursor-pointer opacity-70"
                style={{ backgroundColor: "#010147", color: "#ffffff", borderColor: "#010147" }}
              >
                Sign in
              </button>
            </div>

            <div className="pt-4">
              <p className="text-gray-600 mb-2 text-sm text-left">Don&apos;t have an account?</p>
              <div className="flex justify-center md:justify-start">
                <button
                  type="button"
                  disabled
                  className="py-2 px-6 text-base font-normal min-w-[120px] cursor-pointer opacity-70"
                  style={{ backgroundColor: "#010147", color: "#ffffff", borderColor: "#010147" }}
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">{SITE_DESCRIPTION}</p>
        </div>

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
