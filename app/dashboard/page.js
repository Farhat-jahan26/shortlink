'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [links, setLinks] = useState([])
  const [originalUrl, setOriginalUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [copiedId, setCopiedId] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [editUrl, setEditUrl] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [selectedLink, setSelectedLink] = useState(null)
  const [clickLogs, setClickLogs] = useState([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const router = useRouter()

  // ─── Auth Check ───────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchLinks(session.user.id)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  // ─── Fetch Links ──────────────────────────────────────────
  const fetchLinks = async (userId) => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setLinks(data)
  }

  // ─── Fetch Click Logs (Analytics) ─────────────────────────
  const fetchClickLogs = async (linkId) => {
    setAnalyticsLoading(true)
    const { data, error } = await supabase
      .from('click_logs')
      .select('*')
      .eq('link_id', linkId)
      .order('clicked_at', { ascending: false })

    if (!error) setClickLogs(data)
    setAnalyticsLoading(false)
  }

  // ─── Shorten URL ──────────────────────────────────────────
  const handleShorten = async () => {
  if (!originalUrl.trim()) {
    setMessage({ text: 'Please enter a URL', type: 'error' })
    return
  }

  setSubmitting(true)
  setMessage({ text: '', type: '' })

  // URL format check
  try {
    new URL(originalUrl.trim())
  } catch {
    setMessage({ text: 'Please enter a valid URL (include https://)', type: 'error' })
    setSubmitting(false)
    return
  }

  // Short code generate 
  const short_code = customCode.trim() || Math.random().toString(36).substring(2, 8)

  // Check duplicate
  const { data: existing } = await supabase
    .from('links')
    .select('id')
    .eq('short_code', short_code)
    .single()

  if (existing) {
    setMessage({ text: 'This custom code is already taken. Try another!', type: 'error' })
    setSubmitting(false)
    return
  }

  // (API route bypass)
  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      original_url: originalUrl.trim(),
      short_code,
      clicks: 0
    })
    .select()
    .single()

  if (error) {
    setMessage({ text: error.message, type: 'error' })
  } else {
    setMessage({ text: '✅ Short link created!', type: 'success' })
    setOriginalUrl('')
    setCustomCode('')
    fetchLinks(user.id)
  }

  setSubmitting(false)
}

  // ─── Edit Link ────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editUrl.trim()) return
    const { error } = await supabase
      .from('links')
      .update({ original_url: editUrl.trim() })
      .eq('id', editingLink.id)

    if (!error) {
      setEditingLink(null)
      setEditUrl('')
      fetchLinks(user.id)
    }
  }

  // ─── Delete Link ──────────────────────────────────────────
  const handleDelete = async (linkId) => {
    setDeletingId(linkId)
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', linkId)

    if (!error) {
      if (selectedLink?.id === linkId) {
        setSelectedLink(null)
        setClickLogs([])
      }
      fetchLinks(user.id)
    }
    setDeletingId(null)
  }

  // ─── Copy to Clipboard ────────────────────────────────────
  const handleCopy = (shortCode, id) => {
    const shortUrl = `${window.location.origin}/${shortCode}`
    navigator.clipboard.writeText(shortUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // ─── View Analytics ───────────────────────────────────────
  const handleViewAnalytics = (link) => {
    if (selectedLink?.id === link.id) {
      setSelectedLink(null)
      setClickLogs([])
    } else {
      setSelectedLink(link)
      fetchClickLogs(link.id)
    }
  }

  // ─── Group clicks by date (for mini bar chart) ────────────
  const groupClicksByDate = (logs) => {
    const groups = {}
    logs.forEach((log) => {
      const date = new Date(log.clicked_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short'
      })
      groups[date] = (groups[date] || 0) + 1
    })
    return Object.entries(groups)
      .slice(-7)
      .map(([date, count]) => ({ date, count }))
  }

  // ─── Logout ───────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ─── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#94a3b8',
      fontSize: '18px'
    }}>
      Loading...
    </div>
  )

  // ─── Styles ───────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
  }

  const cardStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
  }

  const chartData = selectedLink ? groupClicksByDate(clickLogs) : []
  const maxClicks = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 1

  // ─── Main UI ──────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 20px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* ── Navbar ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '36px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🔗 ShortLink
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>{user?.email}</span>
            <button onClick={handleLogout} style={{
              padding: '7px 18px',
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              Logout
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Links', value: links.length, icon: '🔗' },
            { label: 'Total Clicks', value: links.reduce((sum, l) => sum + l.clicks, 0), icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} style={{
              ...cardStyle,
              flex: '1',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <span style={{ fontSize: '28px' }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Shorten Form ── */}
        <div style={{ ...cardStyle, marginBottom: '28px' }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            ✂️ Shorten a New URL
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Long URL *
              </label>
              <input
                type="url"
                placeholder="https://example.com/very/long/url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                Custom Short Code (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. my-link"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                style={inputStyle}
              />
            </div>
            {message.text && (
              <p style={{ color: message.type === 'success' ? '#4ade80' : '#f87171', fontSize: '14px' }}>
                {message.text}
              </p>
            )}
            <button
              onClick={handleShorten}
              disabled={submitting}
              style={{
                padding: '12px',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                alignSelf: 'flex-start',
                minWidth: '160px'
              }}
            >
              {submitting ? 'Shortening...' : '🔗 Shorten URL'}
            </button>
          </div>
        </div>

        {/* ── Edit Modal ── */}
        {editingLink && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '20px'
          }}>
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px'
            }}>
              <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                ✏️ Edit Link
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                Short code: <span style={{ color: '#818cf8' }}>/{editingLink.short_code}</span>
              </p>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                New Destination URL
              </label>
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                style={{ ...inputStyle, marginBottom: '20px' }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleEdit} style={{
                  flex: 1,
                  padding: '11px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Save Changes
                </button>
                <button onClick={() => { setEditingLink(null); setEditUrl('') }} style={{
                  flex: 1,
                  padding: '11px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Links List ── */}
        <div style={{ ...cardStyle, marginBottom: '28px' }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            📋 Your Links ({links.length})
          </h2>

          {links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔗</div>
              <p>No links yet — shorten your first URL above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {links.map((link) => (
                <div key={link.id}>
                  <div style={{
                    background: '#0f172a',
                    border: `1px solid ${selectedLink?.id === link.id ? '#6366f1' : '#334155'}`,
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* Link Info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ color: '#818cf8', fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        /{link.short_code}
                      </div>
                      <div style={{
                        color: '#64748b',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '340px'
                      }}>
                        {link.original_url}
                      </div>
                      <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
                        {new Date(link.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Clicks Badge */}
                      <div style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#f1f5f9', fontWeight: '700', fontSize: '16px' }}>
                          {link.clicks}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>clicks</div>
                      </div>

                      {/* Analytics Button */}
                      <button
                        onClick={() => handleViewAnalytics(link)}
                        style={{
                          padding: '8px 14px',
                          background: selectedLink?.id === link.id ? '#6366f1' : '#1e293b',
                          border: '1px solid #6366f1',
                          borderRadius: '8px',
                          color: selectedLink?.id === link.id ? '#fff' : '#6366f1',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}
                      >
                        📊
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopy(link.short_code, link.id)}
                        style={{
                          padding: '8px 14px',
                          background: copiedId === link.id ? '#4ade80' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          color: copiedId === link.id ? '#0f172a' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}
                      >
                        {copiedId === link.id ? '✅' : '📋'}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => { setEditingLink(link); setEditUrl(link.original_url) }}
                        style={{
                          padding: '8px 14px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        ✏️
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deletingId === link.id}
                        style={{
                          padding: '8px 14px',
                          background: '#1e293b',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: deletingId === link.id ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          opacity: deletingId === link.id ? 0.5 : 1
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* ── Analytics Panel (expands below selected link) ── */}
                  {selectedLink?.id === link.id && (
                    <div style={{
                      background: '#0f172a',
                      border: '1px solid #6366f1',
                      borderTop: 'none',
                      borderRadius: '0 0 10px 10px',
                      padding: '20px'
                    }}>
                      {analyticsLoading ? (
                        <p style={{ color: '#64748b', textAlign: 'center' }}>Loading analytics...</p>
                      ) : clickLogs.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center' }}>
                          No clicks yet — share your link to start tracking!
                        </p>
                      ) : (
                        <>
                          {/* Mini Bar Chart */}
                          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px', fontWeight: '600' }}>
                            📈 Clicks (Last 7 Days)
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '8px',
                            height: '80px',
                            marginBottom: '20px'
                          }}>
                            {chartData.map((d) => (
                              <div key={d.date} style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                height: '100%',
                                justifyContent: 'flex-end'
                              }}>
                                <span style={{ color: '#f1f5f9', fontSize: '10px' }}>{d.count}</span>
                                <div style={{
                                  width: '100%',
                                  height: `${(d.count / maxClicks) * 56}px`,
                                  background: 'linear-gradient(180deg, #6366f1, #8b5cf6)',
                                  borderRadius: '4px 4px 0 0',
                                  minHeight: '4px'
                                }} />
                                <span style={{ color: '#475569', fontSize: '9px' }}>{d.date}</span>
                              </div>
                            ))}
                          </div>

                          {/* Recent Clicks Table */}
                          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px', fontWeight: '600' }}>
                            🕐 Recent Clicks
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {clickLogs.slice(0, 5).map((log, i) => (
                              <div key={log.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: '#1e293b',
                                borderRadius: '6px',
                                fontSize: '13px'
                              }}>
                                <span style={{ color: '#64748b' }}>Click #{clickLogs.length - i}</span>
                                <span style={{ color: '#94a3b8' }}>
                                  {new Date(log.clicked_at).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                            {clickLogs.length > 5 && (
                              <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                                + {clickLogs.length - 5} more clicks
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}