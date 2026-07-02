'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('✅ Account created! Redirecting to login...')
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
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
          <p style={{ color: '#64748b', marginTop: '8px' }}>Create your free account</p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {message && (
            <p style={{
              color: message.startsWith('✅') ? '#4ade80' : '#f87171',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {message}
            </p>
          )}

          <button
            onClick={handleSignup}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '24px', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#6366f1', textDecoration: 'none' }}>
            Login here
          </Link>
        </p>
      </div>
    </main>
  )
}