import Link from "next/link"
import Image from "next/image"
import { Lock, Check, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteFooter } from "@/components/SiteFooter"
import { SITE_VISIBLE_KEYWORDS } from "@/lib/seo-metadata"
import { GOIGOE_HANDSHAKE_URL } from "@/lib/auth-redirect"
import { WEALTHCARE_BUTTON_CHROME } from "@/lib/wealthcare-button-styles"
import { SITE_DISPLAY_NAME, SITE_HOMEPAGE_CANONICAL } from "@/lib/site-url"

const PORTAL_ORIGIN = new URL(GOIGOE_HANDSHAKE_URL).origin
const FORGOT_USERNAME_URL = `${PORTAL_ORIGIN}/Authentication/UserNameRetrieval`
const FORGOT_PASSWORD_URL = `${PORTAL_ORIGIN}/Page/ForgotPassword`

const WEALTHCARE_TARGET_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: "#010147",
  color: "#ffffff",
}

/**
 * Server-rendered sign-in page for search and social preview user agents.
 *
 * Rendered by `app/layout.tsx` for those user agents and for the CSP preview. It
 * carries the SSR text search engines index: H1, sign-in card, portal overview,
 * domain services, member support, zero-JS FAQ accordions, visible
 * "Related searches" and the footer. Layout and copy follow `app/page.tsx`.
 *
 * Rules:
 * - Static server component. No "use client" and no form submission logic.
 * - Zero executable JavaScript. The only script is `application/ld+json`.
 * - Form fields are `readOnly` and the action buttons set `aria-disabled`
 *   (never `disabled`), so the shadcn disabled styles do not change the visuals.
 * - Every link is same-window and points to a live portal page.
 * - Copy and FAQ answers are grounded in the portal's public pages (About Us,
 *   Contact Us, Site Map, Registration, Username Retrieval, Forgot Password).
 */

const FAQS = [
  {
    question: "How do I sign in to my Goigoe Wealthcare account?",
    answer:
      "Enter your UserId and Password in the sign-in form and select Sign in. The portal then opens your health savings, flexible spending or COBRA account overview for the employer that administers your benefits.",
  },
  {
    question: "How do I retrieve a forgotten username?",
    answer:
      "Select Let us help beneath the UserId field. The username retrieval page on the Igoe Administrative Services portal walks you through identity verification so you can recover your UserId.",
  },
  {
    question: "How do I reset a forgotten password?",
    answer:
      "Select Let us help beneath the Password field to open the Forgot Password page on the Igoe Administrative Services portal. Follow the prompts to verify your identity and create a new password.",
  },
  {
    question: "How do I register for a new Goigoe Wealthcare account?",
    answer:
      "Select Register to start new-participant enrollment. Registration opens the portal's Registration page, where you enter the account details your employer or benefits administrator provided.",
  },
  {
    question: "Where do I submit a claim or print a claim form?",
    answer:
      "After you sign in, the participant dashboard lists Submit a Claim and Print a Claim Form. Keep itemized receipts for each expense before you start a reimbursement request.",
  },
  {
    question: "Who do I contact for help with my benefits account?",
    answer:
      "Use the Contact Us page for participant questions. The Site Map page lists every portal section, and the Terms of Use and Privacy Policy pages explain how your account information is handled.",
  },
] as const

const DOMAIN_SERVICES = [
  "Health savings account (HSA) balances, contributions and transaction history",
  "Flexible spending account (FSA) and reimbursement claims with receipt upload and printable claim forms",
  "Benefits debit card management and COBRA premium account access",
  "Scheduled payments, HSA bill pay and automatic transfer settings",
  "Account statements, tax forms and communication preferences",
] as const

const BREADCRUMB_SCHEMA = {
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_HOMEPAGE_CANONICAL },
    { "@type": "ListItem", position: 2, name: "Sign In", item: SITE_HOMEPAGE_CANONICAL },
  ],
} as const

const FAQ_SCHEMA = {
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
} as const

const CRAWLER_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [BREADCRUMB_SCHEMA, FAQ_SCHEMA],
} as const

export default function CrawlerSeoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
              alt={`${SITE_DISPLAY_NAME} logo`}
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
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600 w-full min-[769px]:w-[calc(39%-27px)] min-[769px]:ml-[27px]">
            <ol className="flex flex-wrap gap-1">
              <li>
                <Link href="/" className="text-blue-600">
                  Home
                </Link>
                <span aria-hidden="true"> &rsaquo; </span>
              </li>
              <li aria-current="page">Sign In</li>
            </ol>
          </nav>

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
              {SITE_DISPLAY_NAME}
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

            <section className="mt-10 w-full border-t border-neutral-200 pt-6 text-sm leading-relaxed text-neutral-700">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Portal Overview</h2>
              <p className="mb-3">
                {SITE_DISPLAY_NAME} is the member sign-in portal for health savings account (HSA),
                flexible spending account (FSA) and COBRA spending accounts administered for your
                employer by Igoe Administrative Services. Igoe was founded in 1977, incorporated in
                1979 and is based in San Diego, California. The portal gives participants one place to
                review account balances, submit reimbursement claims, manage debit cards and update
                personal profile and communication settings.
              </p>
              <p>
                Sign-in works in any current desktop or mobile browser. Keep your UserId and password
                private, and sign out when you use a shared computer.
              </p>
            </section>

            <section className="mt-6 w-full text-sm leading-relaxed text-neutral-700">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Domain Services Highlights</h2>
              <p className="mb-2">
                Participants who sign in can use the following benefit services:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {DOMAIN_SERVICES.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              <p className="mt-3">
                Beneficiary information, benefit enrollment elections and investment account transfers
                appear in the portal when they apply to your plan.
              </p>
            </section>

            <section className="mt-6 w-full text-sm leading-relaxed text-neutral-700">
              <h2 className="text-lg font-medium text-gray-800 mb-2">Member Support</h2>
              <p className="mb-3">
                Use Let us help beneath the UserId field to recover a forgotten username, and Let us help
                beneath the Password field to reset a forgotten password. New participants start
                enrollment from the Register button. Questions about your account go to the Contact Us page
                linked in the footer, and the Site Map lists every portal section.
              </p>
            </section>

            <section className="mt-6 w-full text-sm text-neutral-700">
              <h2 className="text-lg font-medium text-gray-800 mb-3">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {FAQS.map((faq) => (
                  <details key={faq.question} className="border border-neutral-200 px-4 py-3">
                    <summary className="cursor-pointer font-medium text-gray-800">
                      {faq.question}
                    </summary>
                    <p className="mt-2 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(CRAWLER_JSON_LD) }}
            />

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
