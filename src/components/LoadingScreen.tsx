import React from 'react'
import { Activity } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-full p-6 inline-block animate-pulse">
            <Activity className="w-12 h-12 text-white" />
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold text-white mb-4">💪 PBGB</h2>
        <p className="text-blue-200 mb-8">{message}</p>
        
        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-white bg-opacity-60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-white bg-opacity-60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-white bg-opacity-60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>

        {/* Slow-load notice: revealed by CSS after 8s, so it also appears when the app's
            scripts fail to load. The styles are inline so they don't depend on the CSS file. */}
        <style>{SLOW_NOTICE_CSS}</style>
        <div className="pbgb-slow-notice mt-10" role="status">
          <p className="text-blue-200 mb-4">This is taking longer than it should.</p>
          <a
            href=""
            onClick={(e) => { e.preventDefault(); window.location.reload() }}
            className="inline-block px-6 py-2 rounded-lg bg-white text-blue-900 font-semibold"
          >
            Reload
          </a>
        </div>
      </div>
    </div>
  )
}

const SLOW_NOTICE_CSS = `
.pbgb-slow-notice { visibility: hidden; opacity: 0; animation: pbgb-slow-notice-in 0.3s ease-out 8s forwards; }
@keyframes pbgb-slow-notice-in { to { visibility: visible; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .pbgb-slow-notice { animation-duration: 0s; } }
`

export default LoadingScreen