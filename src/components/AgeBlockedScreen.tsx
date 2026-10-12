import React from 'react'

/** Shown when someone under 13 tries to use PBGB. */
const AgeBlockedScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-3">PBGB is for athletes 13 and older</h1>
      <p className="text-gray-600">
        Thanks for your interest. You can use PBGB once you turn 13. We didn&apos;t keep any of the
        information you entered.
      </p>
    </div>
  </div>
)

export default AgeBlockedScreen
