'use client'

import { useEffect } from 'react'

// Shown when a page crashes after loading (replaces Next's bare "Application error" screen).
// Reload rather than reset(): a fresh load is what actually clears a bad state.
export default function ErrorPage({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-blue-200 mb-8">Reloading usually fixes it.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-lg bg-white text-blue-900 font-semibold"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
