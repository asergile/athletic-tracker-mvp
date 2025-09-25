'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppNavigation() {
  const pathname = usePathname()
  
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4">
        <nav className="flex space-x-8 py-4">
          <Link
            href="/"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname === '/' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            + Add Workout
          </Link>
          
          <Link
            href="/history"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname === '/history' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📋 History
          </Link>
          
          <Link
            href="/weekly-view"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              pathname === '/weekly-view' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📊 Weekly
          </Link>
        </nav>
      </div>
    </div>
  )
}
