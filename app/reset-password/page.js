'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (password.length < 6) {
      setIsError(true)
      setMessage('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setIsError(true)
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setIsError(true)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Password updated successfully! Redirecting to login...')
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 2000)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '6px'
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9' }}>
            🔗 ShortLink
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Set your new password</p>
        </div>

        {!ready ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>
            Verifying your link... If nothing appears, please open the link from your email again.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {message && (
              <p style={{
                color: isError ? '#f87171' : '#4ade80',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}