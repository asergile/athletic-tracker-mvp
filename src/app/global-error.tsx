'use client'

import { useEffect } from 'react'

// Last-resort screen for a crash in the root layout (e.g. the auth provider), where
// error.tsx can't help. It replaces the layout, so it renders its own <html> and <body>
// and uses inline styles (the app's CSS may not be available).
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '0 16px' }}>
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong</h2>
          <p style={{ color: '#bfdbfe', marginBottom: 32 }}>Reloading usually fixes it.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '8px 24px', borderRadius: 8, border: 0, background: '#fff', color: '#1e3a8a', fontWeight: 600, fontSize: 16 }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
