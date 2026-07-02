import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
    }}>

      {/* Logo / Title */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '56px',
          fontWeight: '800',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px'
        }}>
          🔗 ShortLink
        </h1>
        <p style={{ fontSize: '20px', color: '#94a3b8', maxWidth: '480px' }}>
          Convert long URLs into short, shareable links — and track every click.
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/signup" style={{
          padding: '14px 32px',
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          color: '#fff',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          Get Started Free
        </Link>
        <Link href="/login" style={{
          padding: '14px 32px',
          background: 'transparent',
          color: '#6366f1',
          border: '2px solid #6366f1',
          borderRadius: '10px',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          Login
        </Link>
      </div>

      {/* Features */}
      <div style={{
        display: 'flex',
        gap: '24px',
        marginTop: '64px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { icon: '⚡', title: 'Instant Shortening', desc: 'Generate short links in seconds' },
          { icon: '📊', title: 'Click Analytics', desc: 'Track every click in real-time' },
          { icon: '🔒', title: 'Secure & Private', desc: 'Your links, only your dashboard' },
        ].map((feature) => (
          <div key={feature.title} style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            width: '200px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{feature.icon}</div>
            <h3 style={{ color: '#f1f5f9', marginBottom: '8px', fontSize: '16px' }}>{feature.title}</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}