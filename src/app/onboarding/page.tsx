'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { dbHelpers } from '@/lib/security/enhanced-db-helpers'

export default function OnboardingPage(): React.ReactElement {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Screen navigation
  const nextScreen = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1)
    }
  }

  // Handle "Create My First Goal" button
  const handleCreateGoal = () => {
    router.push('/onboarding/create-goal')
  }

  // Handle "Skip" - mark complete and go to dashboard
  const handleSkip = async () => {
    setIsLoading(true)
    try {
      await dbHelpers.markOnboardingComplete()
      router.push('/')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      // Still redirect even if flag update fails
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {/* Phone Frame Container */}
      <div className="w-full max-w-[375px] h-[667px] bg-white rounded-[30px] shadow-2xl overflow-hidden relative">
        
        {/* Screen 1: Welcome */}
        {currentScreen === 1 && (
          <Screen1 
            onNext={nextScreen}
          />
        )}

        {/* Screen 2: Set Goals */}
        {currentScreen === 2 && (
          <Screen2 
            onNext={nextScreen}
          />
        )}

        {/* Screen 3: Track Progress */}
        {currentScreen === 3 && (
          <Screen3 
            onCreateGoal={handleCreateGoal} 
            onSkip={handleSkip}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

// Individual Screen Components
const Screen1 = ({ onNext }: {
  onNext: () => void
}) => (
  <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-blue-900 to-green-500">
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-[120px] h-[120px] mb-8">
        <Image
          src="/images/Logo PB white.png"
          alt="Goal Buddy Logo"
          width={120}
          height={120}
          className="object-contain"
        />
      </div>
      <h1 className="text-[26px] font-bold text-white mb-4">Goal Buddy</h1>
      <p className="text-white text-opacity-95 text-base leading-relaxed max-w-[300px]">
        Welcome to your athletic goal setting and training tracker. Watch your progress, stay consistent, smash your goals.
      </p>
    </div>

    <div className="space-y-4">
      <ProgressDots current={1} total={3} />
      <button
        onClick={onNext}
        className="w-full py-4 rounded-xl bg-white text-blue-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
      >
        Get Started
      </button>
    </div>
  </div>
)

const Screen2 = ({ onNext }: {
  onNext: () => void
}) => {
  const [currentIcon, setCurrentIcon] = useState('🏊‍♂️')
  const sportsIcons = ['🏊‍♂️', '🏃‍♂️', '🚴‍♂️', '🎾', '⚽', '🏋️‍♂️', '🏀', '⛷️']
  const [iconIndex, setIconIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % sportsIcons.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentIcon(sportsIcons[iconIndex])
  }, [iconIndex])

  return (
    <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-purple-400 to-pink-500">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-[120px] h-[120px] mb-8 bg-white bg-opacity-20 border-3 border-white border-opacity-50 rounded-full flex items-center justify-center text-6xl transition-opacity duration-300">
          {currentIcon}
        </div>
        <h1 className="text-[28px] font-bold text-white mb-4">Set Your Goals</h1>
        <p className="text-white text-opacity-90 text-base leading-relaxed max-w-[300px]">
          Create milestones and set specific goals for your competitions. Countdown to race day and watch your progress.
        </p>
      </div>

      <div className="space-y-4">
        <ProgressDots current={2} total={3} />
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl bg-white text-purple-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  )
}

const Screen3 = ({ onCreateGoal, onSkip, isLoading }: {
  onCreateGoal: () => void
  onSkip: () => void
  isLoading: boolean
}) => (
  <div className="h-full flex flex-col justify-between p-8 bg-gradient-to-br from-blue-400 to-cyan-400">
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div className="w-[120px] h-[120px] mb-8 bg-white bg-opacity-20 border-3 border-white border-opacity-50 rounded-full flex items-center justify-center text-6xl">
        🏆
      </div>
      <h1 className="text-[28px] font-bold text-white mb-4">Personal Logbook</h1>
      <p className="text-white text-opacity-90 text-base leading-relaxed max-w-[300px]">
        Quickly log your training sessions and bank hours toward your goals. See your training add up and stay motivated until the big day.
      </p>
    </div>

    <div className="space-y-4">
      <ProgressDots current={3} total={3} />
      <button
        onClick={onCreateGoal}
        className="w-full py-4 rounded-xl bg-white text-blue-900 font-semibold text-lg hover:shadow-lg transition-all duration-200"
      >
        Create My First Goal
      </button>
      <button
        onClick={onSkip}
        disabled={isLoading}
        className="w-full py-4 rounded-xl bg-transparent border-2 border-white border-opacity-50 text-white font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200"
      >
        {isLoading ? 'Loading...' : 'Skip'}
      </button>
    </div>
  </div>
)

const ProgressDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex justify-center gap-2 mb-5">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i + 1 === current
            ? 'w-6 bg-white'
            : 'w-2 bg-white bg-opacity-40'
        }`}
      />
    ))}
  </div>
)
