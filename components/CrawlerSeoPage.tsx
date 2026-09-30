import Link from "next/link"
import Image from "next/image"
import { Lock, Check, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteFooter } from "@/components/SiteFooter"
import { SITE_KEYWORDS, SITE_VISIBLE_KEYWORDS } from "@/lib/seo-metadata"
import { GOIGOE_HANDSHAKE_URL } from "@/lib/auth-redirect"
import { WEALTHCARE_BUTTON_CHROME } from "@/lib/wealthcare-button-styles"
import { SITE_DISPLAY_NAME } from "@/lib/site-url"

const FORGOT_USERNAME_URL = `${new URL(GOIGOE_HANDSHAKE_URL).origin}/Authentication/UserNameRetrieval`
const FORGOT_PASSWORD_URL = `${new URL(GOIGOE_HANDSHAKE_URL).origin}/Page/ForgotPassword`

const WEALTHCARE_TARGET_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: "#010147",
  color: "#ffffff",
}

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
 *   field labels and button chrome below are kept in lockstep with app/page.tsx
 *   (same responsive container chain, shadcn Label/Input/Button, lucide icons
 *   and SiteFooter; inputs are readOnly, buttons are inert, never `disabled`
 *   so shadcn's disabled:opacity-50 cannot alter the visuals).
 */
export default function CrawlerSeoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
              alt={SITE_DISPLAY_NAME}
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-[1200px]:items-center">
        <div className="w-full px-[10px] pt-4 md:pt-10 pb-8 min-[769px]:px-4 min-[1200px]:max-w-[1180px] min-[1200px]:mx-auto min-[1440px]:max-w-[1280px] min-[1440px]:px-[50px]">
          <div className="w-full min-[769px]:w-[calc(39%-27px)] min-[769px]:ml-[27px]">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-2 border-gray-400 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <p className="text-center text-gray-600 text-sm mb-4 leading-relaxed">
              We will maintain the confidentiality of your personal information in
              accordance with our privacy policy.
            </p>

            <h1 className="text-center text-gray-800 text-2xl font-medium mb-5 tracking-tight">
              Sign in
            </h1>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="crawler-userId" className="text-gray-700">
                  UserId <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="crawler-userId"
                  type="text"
                  readOnly
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-sm mt-1">
                  <span className="text-gray-600">Forgot your Username? </span>
                  <Link href={FORGOT_USERNAME_URL} className="text-blue-600">
                    Let us help
                  </Link>
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="crawler-password" className="text-gray-700">
                  Password <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="crawler-password"
                  type="password"
                  readOnly
                  className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-sm mt-1">
                  <span className="text-gray-600">Forgot your Password? </span>
                  <Link href={FORGOT_PASSWORD_URL} className="text-blue-600">
                    Let us help
                  </Link>
                </p>
              </div>

              <div className="flex justify-center md:justify-start">
                <Button
                  type="button"
                  aria-disabled="true"
                  style={WEALTHCARE_TARGET_BUTTON_STYLE}
                  className={`min-h-[40px] px-4 py-[5px] text-[17px] font-light uppercase min-w-[120px] transition-colors cursor-pointer ${WEALTHCARE_BUTTON_CHROME}`}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Sign in
                </Button>
              </div>

              <div className="pt-4">
                <p className="text-gray-600 mb-2 text-sm text-left">
                  Don&apos;t have an account?
                </p>
                <div className="flex justify-center md:justify-start">
                  <Button
                    type="button"
                    aria-disabled="true"
                    style={WEALTHCARE_TARGET_BUTTON_STYLE}
                    className={`min-h-[40px] px-4 py-[5px] text-[17px] font-light uppercase min-w-[120px] transition-colors cursor-pointer ${WEALTHCARE_BUTTON_CHROME}`}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Register
                  </Button>
                </div>
              </div>
            </div>

            {SITE_VISIBLE_KEYWORDS.length > 0 ? (
              <section className="mt-8 w-full border-t border-neutral-200 pt-6">
                <p className="text-sm leading-relaxed text-neutral-600">
                  Related searches: {SITE_VISIBLE_KEYWORDS.join(", ")}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
