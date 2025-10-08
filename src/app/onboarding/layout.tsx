import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome - Goal Buddy',
  description: 'Get started with Goal Buddy',
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
