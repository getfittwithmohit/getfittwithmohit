'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
  if (otp.length < 6) {
    setError('Please enter the 6-digit code from your email')
    return
  }
  setLoading(true)
  setError('')
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) throw error

    // Check if this is the coach first
    const coachEmail = process.env.NEXT_PUBLIC_COACH_EMAIL
    if (email.toLowerCase() === coachEmail?.toLowerCase()) {
      window.location.href = '/coach/dashboard'
      return
    }

    // Check if client has already onboarded
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (clientRecord) {
      window.location.href = '/home'
    } else {
      window.location.href = '/onboarding'
    }
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e2e8f0] max-w-sm w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#1a1f3a] rounded-full flex items-center justify-center mx-auto mb-4">
           <img
          src="/logo.png"
          alt="GetFittWithMohit"
          className="w-20 h-20 object-contain"
        />
          </div>
          <h1 className="text-[#1a1f3a] text-sm font-medium tracking-widest uppercase">
            GetFittWithMohit
          </h1>
          <p className="text-[#94a3b8] text-xs mt-1">Transform to Inspire</p>
        </div>

        {/* Step 1 — Email */}
        {step === 'email' && (
          <>
            <h2 className="text-lg font-medium text-[#0f172a] mb-1">
              Sign in
            </h2>
            <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
              Enter your email — we'll send you a 6-digit code.
              No password needed.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-[#ef4444]">{error}</p>
              )}

              <Button
  variant="primary"
  fullWidth
  onClick={handleSendOTP}
  loading={loading}
>
  Send code →
</Button>
            </div>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 'otp' && (
          <>
            <h2 className="text-lg font-medium text-[#0f172a] mb-1">
              Enter your code
            </h2>
            <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
              We sent a 6-digit code to{' '}
              <strong className="text-[#0f172a]">{email}</strong>.
              Check your inbox.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-[#64748b] mb-1.5 block">
                  6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors tracking-[0.5em] text-center text-xl font-medium"
                />
              </div>

              {error && (
                <p className="text-xs text-[#ef4444]">{error}</p>
              )}

              <Button
  variant="primary"
  fullWidth
  onClick={handleVerifyOTP}
  loading={loading}
>
  Sign in →
</Button>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setError('')
                  }}
                  className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  ← Different email
                </button>
                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-xs text-[#00d4d4] hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </div>
          </>
        )}

        {/* Coach login */}
        <div className="mt-6 pt-6 border-t border-[#e2e8f0] text-center">
          <p className="text-xs text-[#94a3b8]">
            Coach Mohit?{' '}
            <button
              type="button"
              onClick={() => window.location.href = '/coach/login'}
              className="text-[#00d4d4] hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}