'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function CoachLoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const COACH_EMAIL = process.env.NEXT_PUBLIC_COACH_EMAIL || ''

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })
      if (error) throw error
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1f3a] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">

        <div className="text-center mb-8">
  <img
    src="/logo.png"
    alt="GetFittWithMohit"
    className="w-20 h-20 object-contain mx-auto mb-3"
  />
  <h1 className="text-sm font-medium tracking-widest uppercase text-[#1a1f3a]">
    Coach Dashboard
  </h1>
  <p className="text-[#94a3b8] text-xs mt-1">GetFittWithMohit</p>
</div>

        {step === 'email' && (
          <>
            <h2 className="text-lg font-medium text-[#0f172a] mb-1">
              Coach sign in
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Enter your coach email to receive a sign-in code.
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@getfittwithmohit.com"
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors"
              />
              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-2.5 bg-[#1a1f3a] text-[#00d4d4] rounded-lg text-sm font-medium hover:bg-[#141930] transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send code →'}
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-lg font-medium text-[#0f172a] mb-1">
              Enter your code
            </h2>
            <p className="text-sm text-[#64748b] mb-6">
              Sent to <strong>{email}</strong>
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                className="w-full px-3 py-2.5 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#00d4d4] transition-colors tracking-widest text-center text-lg font-medium"
              />
              {error && <p className="text-xs text-[#ef4444]">{error}</p>}
              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full py-2.5 bg-[#1a1f3a] text-[#00d4d4] rounded-lg text-sm font-medium hover:bg-[#141930] transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign in →'}
              </button>
              <button
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                className="text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
              >
                ← Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}