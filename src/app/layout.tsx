'use client'

import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/AuthContext'
import OnboardingCheck from '@/components/OnboardingCheck'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <OnboardingCheck />
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
