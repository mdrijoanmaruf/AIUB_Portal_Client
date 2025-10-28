'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Loading from './loading'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

// Helper function to parse time string to Date object
const parseTimeString = (timeStr: string): Date | null => {
  if (!timeStr) return null
  
  const now = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Extract day, time parts (e.g., "Mon 2:40 PM")
  const match = timeStr.match(/(\w+)\s+(\d+):(\d+)\s*(AM|PM)?/)
  if (!match) return null
  
  const [, day, hours, minutes, period] = match
  let hour = parseInt(hours)
  const minute = parseInt(minutes)
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  
  // Get target day index
  const targetDayIndex = days.indexOf(day)
  if (targetDayIndex === -1) return null
  
  const targetDate = new Date(now)
  targetDate.setHours(hour, minute, 0, 0)
  
  // Adjust to the correct day
  const currentDay = now.getDay()
  let dayDiff = targetDayIndex - currentDay
  
  // If the class is earlier in the week, assume it's for next week
  if (dayDiff < 0) dayDiff += 7
  
  targetDate.setDate(now.getDate() + dayDiff)
  
  return targetDate
}

// Calculate time difference in seconds
const getTimeDifference = (startTime: string, endTime: string): { status: 'upcoming' | 'ongoing' | 'ended', secondsLeft: number } => {
  const now = new Date()
  const start = parseTimeString(startTime)
  const end = parseTimeString(endTime)
  
  if (!start || !end) return { status: 'ended', secondsLeft: 0 }
  
  const nowTime = now.getTime()
  const startTime_ms = start.getTime()
  const endTime_ms = end.getTime()
  
  if (nowTime < startTime_ms) {
    // Class hasn't started yet
    return { status: 'upcoming', secondsLeft: Math.floor((startTime_ms - nowTime) / 1000) }
  } else if (nowTime >= startTime_ms && nowTime <= endTime_ms) {
    // Class is ongoing
    return { status: 'ongoing', secondsLeft: Math.floor((endTime_ms - nowTime) / 1000) }
  } else {
    // Class has ended
    return { status: 'ended', secondsLeft: 0 }
  }
}

// Format seconds to readable time
const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return '0s'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)
  
  return parts.join(' ')
}

// Format seconds to HH:MM:SS or MM:SS (colon separated)
const formatColonTime = (seconds: number): string => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
  return `${pad(mins)}:${pad(secs)}`
}

// Check if schedule is for today
const isToday = (scheduleDate: string): boolean => {
  const today = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayName = days[today.getDay()]
  return scheduleDate.includes(todayName)
}

interface UserData {
  username: string
  studentName: string
  studentId: string
  teamsEmail?: string
  teamsPassword?: string
  pageTitle: string
  classSchedule: Array<{
    date: string
    classes: Array<{
      courseName: string
      time: string[]
      room: string
    }>
  }>
  registration: {
    semesters: Array<{
      text: string
      selected: boolean
    }>
    courses: Array<{
      courseCode: string
      courseName: string
      sectionStatus: string
      statusLabels: Array<{
        type: string
        text: string
      }>
      result: string
      timeInfo?: Array<{
        start: string
        end: string
        room: string
      }>
      credits?: string
      status?: string
    }>
  }
}

const Home = () => {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [cardsToShow, setCardsToShow] = useState<number>(6)

  useEffect(() => {
    fetchUserData()
    
    // Update current time every second for live timer
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Responsive card count: desktop -> 6, mobile -> 4
  useEffect(() => {
    const updateCards = () => {
      if (typeof window === 'undefined') return
      const width = window.innerWidth
      // Tailwind 'lg' breakpoint is 1024px
      setCardsToShow(width >= 1024 ? 6 : 4)
    }

    updateCards()
    window.addEventListener('resize', updateCards)
    return () => window.removeEventListener('resize', updateCards)
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get auth token from localStorage
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        // No token, redirect to login
        router.push('/')
        return
      }
      
      const response = await fetch(`${API_BASE}/user/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success && result.data) {
        setUserData(result.data)
      } else {
        // Token invalid or expired, redirect to login
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        router.push('/')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      setError('Failed to load user data')
      // Redirect to login on error
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    // Redirect to login
    router.push('/')
  }

  if (loading) {
    return <Loading />
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 via-white to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-red-200 shadow-lg">
          <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-lg font-medium">{error || 'No user data found'}</p>
          <p className="text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const currentSemester = userData.registration.semesters.find(s => s.selected)

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Classic Header with Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 mb-6">
          <div className="relative bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-6">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {userData.studentName || 'Student Portal'}
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ml-15">
                  <p className="text-blue-100 font-medium">ID: {userData.studentId}</p>
                  <span className="hidden sm:block text-blue-200">•</span>
                  <p className="text-blue-100 font-medium">{currentSemester?.text || 'Current Semester'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Microsoft Teams Credentials */}
          {userData.teamsEmail && userData.teamsPassword && (
            <div className="bg-emerald-50/80 border-t border-emerald-200/50 px-6 py-4">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100/80 rounded-xl p-2 mt-1">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Microsoft Teams Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-emerald-700/80 font-medium text-xs mb-1">Username</p>
                      <p className="text-emerald-800 font-mono bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-emerald-200/50 text-sm">
                        {userData.teamsEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-700/80 font-medium text-xs mb-1">Password</p>
                      <p className="text-emerald-800 font-mono bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-emerald-200/50 text-sm">
                        {userData.teamsPassword}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50/50">
            <div className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4 hover:border-blue-300/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium mb-1 text-sm">Total Courses</p>
                  <p className="text-3xl font-bold text-blue-600">{userData.registration.courses.filter(c => c.status !== 'Dropped').length}</p>
                </div>
                <div className="bg-blue-100/80 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-purple-200/50 rounded-xl p-4 hover:border-purple-300/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium mb-1 text-sm">Schedule Days</p>
                  <p className="text-3xl font-bold text-purple-600">{userData.classSchedule.length}</p>
                </div>
                <div className="bg-purple-100/80 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-xl p-4 hover:border-emerald-300/70 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 font-medium mb-1 text-sm">Today's Classes</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {userData.classSchedule[0]?.classes.filter(c => c.courseName !== 'No Class On This Day').length || 0}
                  </p>
                </div>
                <div className="bg-emerald-100/80 p-3 rounded-xl">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Sections */}
        <div className="space-y-6">
          {/* Class Schedule Section - FIRST */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
            <div className="relative bg-linear-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <h2 className="relative z-10 text-xl font-bold text-white flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Class Schedule
                <span className="ml-auto text-sm font-normal text-cyan-100 bg-white/10 px-3 py-1 rounded-full">
                  {userData.classSchedule.length} Days
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.classSchedule.slice(0, cardsToShow).map((schedule, index) => (
                  <div key={index} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:border-cyan-300/70 transition-all duration-300">
                    <div className="bg-linear-to-r from-cyan-50/80 to-blue-50/80 border-b border-cyan-200/50 px-4 py-3">
                      <h3 className="font-bold text-base text-cyan-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                        {schedule.date}
                      </h3>
                    </div>
                    {schedule.classes.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {schedule.classes.map((classItem, classIndex) => {
                          if (classItem.courseName === 'No Class On This Day') {
                            return (
                              <div key={classIndex} className="text-center py-4">
                                <div className="inline-flex items-center gap-2 bg-gray-100/80 px-4 py-2 rounded-lg border border-gray-200/50">
                                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                  </svg>
                                  <span className="text-gray-600 italic font-medium text-sm">{classItem.courseName}</span>
                                </div>
                              </div>
                            )
                          }

                          const timeData = classItem.time && classItem.time.length === 2 
                            ? getTimeDifference(classItem.time[0], classItem.time[1])
                            : null

                          // For today's classes, only show timer
                          if (isToday(schedule.date) && classItem.courseName !== 'No Class On This Day') {
                            return (
                              <div key={classIndex} className="flex items-center justify-center">
                                {timeData && (
                                  <div className="w-full">
                                    {timeData.status === 'upcoming' && (
                                      <div className="px-2 py-1">
                                        <div className="flex items-center justify-between gap-2 text-sm font-bold">
                                          <span className="text-amber-700 uppercase tracking-wide">Starts In:</span>
                                          <span className="font-mono text-lg text-amber-800">{formatColonTime(timeData.secondsLeft)}</span>
                                        </div>
                                        <p className="text-xs text-amber-700 font-medium text-center mt-1">{classItem.courseName}</p>
                                      </div>
                                    )}
                                    {timeData.status === 'ongoing' && (
                                      <div className="px-2 py-1">
                                        <div className="flex items-center justify-between gap-2 text-sm font-bold">
                                          <span className="text-emerald-700 uppercase tracking-wide">Ends In:</span>
                                          <span className="font-mono text-lg text-emerald-800">{formatColonTime(timeData.secondsLeft)}</span>
                                        </div>
                                        <p className="text-xs text-emerald-700 font-medium text-center mt-1">{classItem.courseName}</p>
                                      </div>
                                    )}
                                    {timeData.status === 'ended' && (
                                      <div className="px-2 py-1">
                                        <div className="flex items-center justify-between gap-2 text-sm font-bold">
                                          <span className="text-gray-600 uppercase tracking-wide">Status:</span>
                                          <span className="text-gray-700 font-medium">Ended</span>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium text-center mt-1">{classItem.courseName}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return (
                            <div key={classIndex} className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg p-3 hover:border-cyan-300/70 transition-all duration-300">
                              <div className="flex flex-col gap-2">
                                <div className="flex-1">
                                  <h4 className="font-bold text-sm text-cyan-700 mb-1">{classItem.courseName}</h4>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {classItem.time && classItem.time.length > 0 && (
                                      <div className="flex items-center gap-1 bg-gray-100/80 px-2 py-1 rounded-md border border-gray-200/50">
                                        <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">
                                          {classItem.time.length === 2
                                            ? `${classItem.time[0]} - ${classItem.time[1]}`
                                            : classItem.time[0]
                                          }
                                        </span>
                                      </div>
                                    )}
                                    {classItem.room && (
                                      <div className="flex items-center gap-1 bg-gray-100/80 px-2 py-1 rounded-md border border-gray-200/50">
                                        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="text-gray-700 font-medium">Room {classItem.room}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Live Timer */}
                                {timeData && (
                                  <div className="w-full">
                                    {timeData.status === 'upcoming' && (
                                      <div className="px-1 py-0">
                                        <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                          <span className="text-amber-700 uppercase tracking-wide">Starts In:</span>
                                          <span className="font-mono text-sm text-amber-800">{formatColonTime(timeData.secondsLeft)}</span>
                                        </div>
                                      </div>
                                    )}
                                    {timeData.status === 'ongoing' && (
                                      <div className="px-1 py-0">
                                        <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                          <span className="text-emerald-700 uppercase tracking-wide">Ends In:</span>
                                          <span className="font-mono text-sm text-emerald-800">{formatColonTime(timeData.secondsLeft)}</span>
                                        </div>
                                      </div>
                                    )}
                                    {timeData.status === 'ended' && (
                                      <div className="px-1 py-0">
                                        <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                          <span className="text-gray-600 uppercase tracking-wide">Status:</span>
                                          <span className="text-gray-700 font-medium text-xs">Ended</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 italic text-sm">No classes scheduled</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registered Courses Section - SECOND */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
            <div className="relative bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-5">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16"></div>
              <h2 className="relative z-10 text-xl font-bold text-white flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                Registered Courses
                <span className="ml-auto text-sm font-normal text-violet-100 bg-white/10 px-3 py-1 rounded-full">
                  {userData.registration.courses.filter(c => c.status !== 'Dropped').length} Active
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.registration.courses.filter(c => c.status !== 'Dropped').slice(0, cardsToShow).map((course, index) => (
                  <div key={index} className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:border-purple-300/70 transition-all duration-300">
                    <div className="bg-linear-to-r from-violet-50/80 to-purple-50/80 border-b border-violet-200/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                        <span className="bg-purple-100/80 text-purple-700 text-xs font-bold px-2 py-1 rounded-lg border border-purple-200/50">
                          {course.courseCode}
                        </span>
                        {course.status && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            course.status === 'Active' 
                              ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50' 
                              : 'bg-red-100/80 text-red-700 border border-red-200/50'
                          }`}>
                            {course.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-sm text-purple-700 mb-2">{course.courseName}</h4>
                      
                      <div className="space-y-2 text-xs">
                        {course.credits && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Credits:</span>
                            <span className="font-mono font-bold text-cyan-600 bg-cyan-50/80 px-2 py-1 rounded-md border border-cyan-200/50">
                              {course.credits}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Section:</span>
                          <span className="text-gray-700 font-medium">{course.sectionStatus}</span>
                        </div>

                        {course.timeInfo && course.timeInfo.length > 0 && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700 font-medium">
                              {course.timeInfo[0].start} - {course.timeInfo[0].end}
                            </span>
                          </div>
                        )}

                        {course.result && course.result !== '-' && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Result:</span>
                            <span className="font-bold text-gray-800">{course.result}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {course.statusLabels && course.statusLabels.slice(0, 2).map((label, labelIndex) => (
                          <span
                            key={labelIndex}
                            className={`text-xs font-bold px-2 py-1 rounded-md ${
                              label.type === 'success'
                                ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50'
                                : label.type === 'danger'
                                ? 'bg-red-100/80 text-red-700 border border-red-200/50'
                                : 'bg-amber-100/80 text-amber-700 border border-amber-200/50'
                            }`}
                          >
                            {label.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Semester Information */}
        {userData.registration.semesters && userData.registration.semesters.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
            <div className="relative bg-linear-to-r from-teal-500 via-cyan-500 to-blue-500 px-6 py-5">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
              <h2 className="relative z-10 text-xl font-bold text-white flex items-center gap-3">
                <div className="bg-white/30 backdrop-blur-sm p-2 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                Available Semesters
                <span className="ml-auto text-sm font-normal text-teal-100 bg-white/10 px-3 py-1 rounded-full">
                  {userData.registration.semesters.length} Total
                </span>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userData.registration.semesters.slice(0, cardsToShow).map((semester, index) => (
                  <div
                    key={index}
                    className={`bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:border-teal-300/70 transition-all duration-300 ${
                      semester.selected
                        ? 'border-teal-300/70 bg-teal-50/80'
                        : 'border-gray-200/50 bg-gray-50/80'
                    }`}
                  >
                    <div className="bg-linear-to-r from-teal-50/80 to-cyan-50/80 border-b border-teal-200/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-bold text-teal-700">Semester</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {semester.selected && (
                          <div className="bg-teal-100/80 p-2 rounded-lg border border-teal-200/50">
                            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-sm font-bold ${
                          semester.selected ? 'text-teal-700' : 'text-gray-600'
                        }`}>
                          {semester.text}
                        </span>
                      </div>
                      {semester.selected && (
                        <p className="text-xs text-teal-600 font-medium mt-2">Currently Selected</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  )
}

export default Home