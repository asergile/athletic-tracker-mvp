'use client'

import React, { useState } from 'react'
import { Clock, Edit, Mic, FileText, ArrowLeft, Plus, Route } from 'lucide-react'
import Link from 'next/link'

// Mock workout data
const mockWorkouts = [
  {
    id: '1',
    workout_type: 'Walking',
    duration: 18,
    rating: 1,
    date: 'Yesterday',
    distance: 0.18,
    distance_unit: 'kilometers',
    voice_transcription: null,
    workout_analysis: null
  },
  {
    id: '2',
    workout_type: 'Walking',
    duration: 15,
    rating: 3,
    date: 'Wed, Sep 24',
    distance: 0.15,
    distance_unit: 'kilometers',
    voice_transcription: 'Great pace today, felt strong throughout',
    workout_analysis: 'Consistent effort with good form'
  },
  {
    id: '3',
    workout_type: 'Walking',
    duration: 10,
    rating: 2,
    date: 'Wed, Sep 24',
    distance: 0.2,
    distance_unit: 'miles',
    voice_transcription: 'Felt okay, slightly tired',
    workout_analysis: null
  },
  {
    id: '4',
    workout_type: 'Walking',
    duration: 17,
    rating: 3,
    date: 'Wed, Sep 24',
    distance: 0.17,
    distance_unit: 'miles',
    voice_transcription: 'Amazing workout, pushed hard',
    workout_analysis: 'Excellent progression and intensity'
  },
  {
    id: '5',
    workout_type: 'Running',
    duration: 45,
    rating: 2,
    date: 'Tue, Sep 23',
    distance: 5.2,
    distance_unit: 'miles',
    voice_transcription: null,
    workout_analysis: null
  },
  {
    id: '6',
    workout_type: 'Cycling',
    duration: 90,
    rating: 3,
    date: 'Mon, Sep 22',
    distance: 25,
    distance_unit: 'miles',
    voice_transcription: 'Perfect weather, felt incredible',
    workout_analysis: 'Strong endurance performance'
  }
]

// Rating configurations
const ratingLabels = {
  1: { label: 'Struggled', emoji: '😤', color: 'from-red-500 to-red-600' },
  2: { label: 'Decent', emoji: '😊', color: 'from-yellow-500 to-orange-500' },
  3: { label: 'Great', emoji: '🔥', color: 'from-green-500 to-emerald-600' }
}

// Helper function to format time
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

// Current card design (from your app)
const CurrentCard = ({ workout }: { workout: any }) => {
  const ratingConfig = ratingLabels[workout.rating as keyof typeof ratingLabels]
  const hasVoiceData = workout.voice_transcription || workout.workout_analysis

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-200 relative">
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex space-x-2">
        <button
          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          title={hasVoiceData ? "View voice analysis" : "Add voice note"}
        >
          {hasVoiceData ? (
            <FileText className="w-4 h-4 text-gray-600" />
          ) : (
            <Mic className="w-4 h-4 text-gray-600" />
          )}
        </button>
        <button
          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          title="Edit workout"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center justify-between pr-20">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-bold text-gray-800">{workout.workout_type}</h3>
            <span className="text-sm text-gray-500">{workout.date}</span>
            {hasVoiceData && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Mic className="w-3 h-3 mr-1" />
                Voice Note
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatTime(workout.duration)}</span>
            </div>
            {workout.distance && (
              <div className="flex items-center space-x-1 text-gray-600">
                <Route className="w-4 h-4" />
                <span>{workout.distance} {workout.distance_unit}</span>
              </div>
            )}
            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${ratingConfig.color} text-white text-sm font-medium`}>
              <span>{ratingConfig.emoji}</span>
              <span>{ratingConfig.label}</span>
            </div>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${ratingConfig.color} flex items-center justify-center text-xl`}>
          {ratingConfig.emoji}
        </div>
      </div>
    </div>
  )
}

// Improved card design
const ImprovedCard = ({ workout }: { workout: any }) => {
  const ratingConfig = ratingLabels[workout.rating as keyof typeof ratingLabels]
  const hasVoiceData = workout.voice_transcription || workout.workout_analysis

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 relative">
      {/* Action Buttons - Larger and better positioned */}
      <div className="absolute top-4 right-4 flex space-x-3">
        <button
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors relative ${
            hasVoiceData 
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={hasVoiceData ? "View voice analysis" : "Add voice note"}
        >
          {hasVoiceData ? (
            <FileText className="w-5 h-5" />
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5" />
            </>
          )}
        </button>
        <button
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          title="Edit workout"
        >
          <Edit className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="pr-28">
        {/* Header with workout type and date */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{workout.workout_type}</h3>
          <span className="text-sm text-gray-500 font-medium">{workout.date}</span>
        </div>

        {/* Workout details */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTime(workout.duration)}</span>
          </div>
          {workout.distance && (
            <div className="flex items-center space-x-2 text-gray-700">
              <Route className="w-4 h-4" />
              <span className="font-medium">{workout.distance} {workout.distance_unit}</span>
            </div>
          )}
        </div>

        {/* Rating and voice note - prominently displayed */}
        <div className="flex items-center space-x-3">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${ratingConfig.color} text-white font-semibold shadow-lg`}>
            <span className="text-lg">{ratingConfig.emoji}</span>
            <span>{ratingConfig.label}</span>
          </div>
          
          {hasVoiceData && (
            <div className="inline-flex items-center space-x-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">Voice Note</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Athlete-focused card design (inspired by the images you shared)
const AthleteCard = ({ workout }: { workout: any }) => {
  const ratingConfig = ratingLabels[workout.rating as keyof typeof ratingLabels]
  const hasVoiceData = workout.voice_transcription || workout.workout_analysis

  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 relative">
      {/* Action Buttons - Bigger and better positioned */}
      <div className="absolute top-4 right-4 flex space-x-3 z-10">
        <button
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all relative"
          title={hasVoiceData ? "View voice analysis" : "Add voice note"}
        >
          {hasVoiceData ? (
            <FileText className="w-5 h-5 text-gray-600" />
          ) : (
            <>
              <Mic className="w-5 h-5 text-gray-600" />
              <Plus className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5" />
            </>
          )}
        </button>
        <button
          className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
          title="Edit workout"
        >
          <Edit className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="pr-28">
        {/* Workout type - prominent */}
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{workout.workout_type}</h3>
        <p className="text-gray-500 text-sm font-medium mb-4">{workout.date}</p>

        {/* Stats in a row */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-lg font-bold text-gray-900">{formatTime(workout.duration)}</span>
          </div>
          {workout.distance && (
            <div className="flex items-center space-x-2">
              <Route className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">{workout.distance}</span>
              <span className="text-sm text-gray-600 font-medium">{workout.distance_unit}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating pill positioned below action buttons on the right */}
      <div className="absolute top-20 right-4">
        <div className={`inline-flex items-center space-x-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r ${ratingConfig.color} text-white shadow-lg transform hover:scale-105 transition-transform`}>
          <span className="text-xl">{ratingConfig.emoji}</span>
          <span className="text-base font-bold">{ratingConfig.label}</span>
        </div>
      </div>
    </div>
  )
}

export default function CardPlayground() {
  const [selectedDesign, setSelectedDesign] = useState<'current' | 'improved' | 'athlete'>('current')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/history" className="text-white hover:text-purple-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Card Playground</h1>
              <p className="text-purple-200 text-sm sm:text-base">Test workout card designs</p>
            </div>
          </div>
        </div>

        {/* Design Selector */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-3">Choose Design:</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setSelectedDesign('current')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'current'
                  ? 'bg-white text-gray-900'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setSelectedDesign('improved')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'improved'
                  ? 'bg-white text-gray-900'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              Improved
            </button>
            <button
              onClick={() => setSelectedDesign('athlete')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDesign === 'athlete'
                  ? 'bg-white text-gray-900'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              Athlete-Focused
            </button>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 pb-8">
        <div className="space-y-4">
          {mockWorkouts.map((workout) => (
            <div key={workout.id}>
              {selectedDesign === 'current' && <CurrentCard workout={workout} />}
              {selectedDesign === 'improved' && <ImprovedCard workout={workout} />}
              {selectedDesign === 'athlete' && <AthleteCard workout={workout} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}