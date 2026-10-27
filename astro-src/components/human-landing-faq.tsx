/**
 * Below-fold FAQ for human Astro landing (cloaking parity with crawler-seo twin).
 * Mount INSIDE LandingShell / SteinsGate so cloaked direct visits never see it.
 */
import { SITE_DISPLAY_NAME } from "@/lib/site-url"

const FAQS = [
  {
    q: `How do I sign in to my ${SITE_DISPLAY_NAME} account?`,
    a: "Enter your UserId and Password in the sign-in form and select Sign in. The portal then opens your health savings, flexible spending, HRA, lifestyle spending, dependent care, commuter or COBRA account overview for the employer that administers your benefits through Igoe Administrative Services.",
  },
  {
    q: "How do I retrieve a forgotten username?",
    a: "Select Let us help beneath the UserId field. The username retrieval page on the Igoe Administrative Services portal walks you through identity verification so you can recover your UserId.",
  },
  {
    q: "How do I reset a forgotten password?",
    a: "Select Let us help beneath the Password field to open the Forgot Password page on the Igoe Administrative Services portal. Follow the prompts to verify your identity and create a new password.",
  },
  {
    q: `How do I register for a new ${SITE_DISPLAY_NAME} account?`,
    a: "Select Register to start new-participant enrollment. Registration opens the portal Registration page, where you enter the account details your employer or benefits administrator provided.",
  },
  {
    q: "Who do I contact for help with my spending account?",
    a: "Call participant services at (800) 633-8818, option 1. The automated system is available 24/7; live agents are available Monday through Friday, 5:00 a.m. to 5:00 p.m. Pacific. You can also use Contact Us in the footer.",
  },
] as const

export function HumanLandingFaq() {
  return (
    <section
      className="mt-10 max-w-xl mx-auto px-4 pb-12 text-sm text-neutral-600"
      aria-labelledby="human-landing-faq-heading"
    >
      <h2
        id="human-landing-faq-heading"
        className="text-base font-semibold text-neutral-900 mb-3"
      >
        Frequently asked questions
      </h2>
      <div className="space-y-2">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="rounded-md border border-neutral-200 bg-neutral-50/50 p-3"
          >
            <summary className="cursor-pointer font-medium text-neutral-800">
              {item.q}
            </summary>
            <p className="mt-2 text-neutral-600 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
