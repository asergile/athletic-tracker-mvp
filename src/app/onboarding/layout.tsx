import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome - PBGB',
  description: 'Get started with PBGB (Personal Best Goal Buddy)',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
