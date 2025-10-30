'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Loading from './loading'
import { prefetchAllData } from '@/lib/prefetch'
import Footer from '@/components/Footer/Footer'
import { motion } from 'framer-motion'

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

      // Check if data is cached
      const cachedUserData = localStorage.getItem('userData')
      const cacheTimestamp = localStorage.getItem('userDataTimestamp')
      
      if (cachedUserData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp)
        // Cache for 10 minutes (600000 ms) - shorter duration for user data
        if (age < 600000) {
          try {
            const parsedCache = JSON.parse(cachedUserData)
            if (parsedCache && parsedCache.studentId) {
              console.log('Using cached user data')
              setUserData(parsedCache)
              setLoading(false)
              
              // 🚀 Prefetch data silently in background (no UI indicator)
              prefetchAllData(token).then(result => {
                if (result.success) {
                  console.log('🎉 All data successfully prefetched:', result.cached.join(', '))
                } else if (result.cached.length > 0) {
                  console.log('✅ Prefetched:', result.cached.join(', '))
                  console.warn('⚠️ Failed:', result.failed.join(', '))
                }
              }).catch(error => {
                console.error('❌ Prefetch error:', error)
              })
              
              return
            }
          } catch (error) {
            console.error('Error parsing cached user data:', error)
          }
        }
      }
      
      // Fetch fresh data if no valid cache
      console.log('Fetching fresh user data from server')
      const response = await fetch(`${API_BASE}/user/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success && result.data) {
        setUserData(result.data)
        
        // Cache the user data
        try {
          localStorage.setItem('userData', JSON.stringify(result.data))
          localStorage.setItem('userDataTimestamp', Date.now().toString())
        } catch (error) {
          console.error('Error caching user data:', error)
        }

        // 🚀 AUTOMATIC DATA PREFETCH - Prefetch all page data silently in background
        // This runs asynchronously without blocking the UI
        prefetchAllData(token).then(result => {
          if (result.success) {
            console.log('🎉 All data successfully prefetched:', result.cached.join(', '))
          } else {
            console.warn('⚠️ Some data failed to prefetch:', result.failed.join(', '))
          }
        }).catch(error => {
          console.error('❌ Prefetch error:', error)
        })
      } else {
        // Token invalid or expired, redirect to login
        localStorage.removeItem('authToken')
        localStorage.removeItem('userData')
        localStorage.removeItem('userDataTimestamp')
        router.push('/')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      setError('Failed to load user data')
      // Redirect to login on error
      localStorage.removeItem('authToken')
      localStorage.removeItem('userData')
      localStorage.removeItem('userDataTimestamp')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear localStorage - including cache
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userDataTimestamp')
    localStorage.removeItem('allCourseSections')
    localStorage.removeItem('allCourseSectionsTimestamp')
    localStorage.removeItem('courseNames')
    localStorage.removeItem('courseNamesTimestamp')
    localStorage.removeItem('gradeReportData')
    localStorage.removeItem('gradeReportTimestamp')
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {userData.studentName || 'Student Portal'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <p className="text-gray-600 font-medium">ID: {userData.studentId}</p>
                <span className="hidden sm:block text-gray-400">•</span>
                <p className="text-gray-600 font-medium">{currentSemester?.text || 'Current Semester'}</p>
              </div>
            </motion.div>
            {/* <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button> */}
          </div>

          {/* Microsoft Teams Credentials */}
          {userData.teamsEmail && userData.teamsPassword && (
            <motion.div 
              className="bg-linear-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 rounded-lg p-2 mt-0.5">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Microsoft Teams Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Username</p>
                      <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border text-gray-600 border-gray-200">
                        {userData.teamsEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Password</p>
                      <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                        {userData.teamsPassword}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div 
              className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{userData.registration.courses.filter(c => c.status !== 'Dropped').length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Schedule Days</p>
                  <p className="text-3xl font-bold text-gray-900">{userData.classSchedule.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Today's Classes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {userData.classSchedule[0]?.classes.filter(c => c.courseName !== 'No Class On This Day').length || 0}
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* Class Schedule Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Class Schedule
              <span className="text-sm font-normal text-gray-500">({userData.classSchedule.length} Days)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.classSchedule.slice(0, cardsToShow).map((schedule, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gray-50/80 backdrop-blur-sm border-2 border-cyan-200/50 rounded-xl overflow-hidden hover:border-cyan-400/70 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <div className="bg-linear-to-r from-cyan-100/80 to-blue-100/80 border-b-2 border-cyan-300/50 px-4 py-3">
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
                  </motion.div>
                ))}
              </div>
          </motion.div>

          {/* Registered Courses Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Registered Courses
              <span className="text-sm font-normal text-gray-500">({userData.registration.courses.filter(c => c.status !== 'Dropped').length} Active)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.registration.courses.filter(c => c.status !== 'Dropped').slice(0, cardsToShow).map((course, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gray-50/80 backdrop-blur-sm border-2 border-violet-200/50 rounded-xl overflow-hidden hover:border-violet-400/70 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                  >
                    <div className="bg-linear-to-r from-violet-100/80 to-purple-100/80 border-b-2 border-violet-300/50 px-4 py-3">
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
                  </motion.div>
                ))}
              </div>
          </motion.div>
        </div>

        {/* Semester Information */}
        {/* {userData.registration.semesters && userData.registration.semesters.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold bg-linear-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Available Semesters
              <span className="text-sm font-normal text-gray-500">({userData.registration.semesters.length} Total)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.registration.semesters.slice(0, cardsToShow).map((semester, index) => (
                  <div
                    key={index}
                    className={`bg-gray-50/80 backdrop-blur-sm border-2 border-teal-200/50 rounded-xl overflow-hidden hover:border-teal-400/70 transition-all duration-300 ${
                      semester.selected
                        ? 'border-teal-400/70 bg-teal-50/80'
                        : 'border-gray-200/50 bg-gray-50/80'
                    }`}
                  >
                    <div className="bg-linear-to-r from-teal-100/80 to-cyan-100/80 border-b-2 border-teal-300/50 px-4 py-3">
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
        )} */}
      </div>

      <Footer/>
    </div>
  )
}

export default Home