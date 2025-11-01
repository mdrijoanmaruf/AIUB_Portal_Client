'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar/Navbar'
import Loading from '../home/loading'
import Footer from '@/components/Footer/Footer'
import { cacheManager, initAutoLogout } from '@/lib/cacheManager'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

interface StudentInfo {
  name: string
  id: string
  email?: string
}

interface Semester {
  text: string
  selected: boolean
}

interface Course {
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
}

interface PaymentInfo {
  creditBreakdown: {
    lecture: string
    science: string
    computer: string
    language: string
    studio: string
    healthScience: string
  }
  fees: {
    admission: string
    tuition: string
    computerLab: string
    scienceLab: string
    languageLab: string
    studio: string
    healthScience: string
    annualCharge: string
    activityFee: string
    verificationFee: string
    miscellaneous: string
  }
  summary: {
    total: string
    deduction: string
    previousBalance: string
    netTotal: string
    amountPaid: string
    balance: string
  }
}

interface RegistrationData {
  studentInfo: StudentInfo
  semesters: Semester[]
  courses: Course[]
  paymentInfo: PaymentInfo
  timestamp: string
}

const Registration = () => {
  const router = useRouter()
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cardsToShow, setCardsToShow] = useState<number>(6)

  useEffect(() => {
    // Initialize cache management and auto logout
    initAutoLogout(router)
    
    fetchRegistrationData()

    // Responsive card count: desktop -> 6, mobile -> 4
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

  const fetchRegistrationData = async () => {
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

      // Check if data is cached with new cache manager
      const cachedRegistrationData = cacheManager.getCache('registrationData')
      
      if (cachedRegistrationData && cachedRegistrationData.studentInfo) {
        setRegistrationData(cachedRegistrationData)
        setLoading(false)
        return
      }

      // Fetch fresh data if no valid cache
      const response = await fetch(`${API_BASE}/registration/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()

      if (result.success && result.data) {
        setRegistrationData(result.data)

        // Cache the registration data with 5-minute expiry
        try {
          cacheManager.setCache('registrationData', result.data, {
            maxAge: 5 * 60 * 1000, // 5 minutes
            onExpiry: () => {
              cacheManager.autoLogout()
            }
          })
        } catch (error) {
          console.error('Error caching registration data:', error)
        }
      } else {
        console.error('Invalid response format:', result)
        // Token invalid or expired, redirect to login
        localStorage.removeItem('authToken')
        router.push('/')
      }
    } catch (err: any) {
      console.error('Error fetching registration data:', err)
      console.error('Error details:', err.message, err.stack)
      setError('Failed to load registration data: ' + err.message)
      
      // Don't redirect immediately on error - let user see the error message
      // Only redirect if it's an auth error
      if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        localStorage.removeItem('authToken')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (error || !registrationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 via-white to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-red-200 shadow-lg">
          <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-lg font-medium">{error || 'No registration data found'}</p>
          <p className="text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const currentSemester = registrationData?.semesters?.find(s => s.selected)
  const activeCourses = registrationData?.courses?.filter(c => c.status !== 'Dropped') || []

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
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="bg-linear-to-r from-sky-50 to-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registration Portal</h1>
                    <p className="text-sm text-gray-600 mt-1">{registrationData.studentInfo?.name} • ID: {registrationData.studentInfo?.id} • {currentSemester?.text || 'Current Semester'}</p>
                  </div>
                </div>

                <div className="hidden sm:flex sm:gap-6 items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Registered</p>
                    <p className="text-sm font-bold text-gray-900">{activeCourses.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Semesters</p>
                    <p className="text-sm font-bold text-gray-900">{registrationData.semesters.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-sm font-bold text-gray-900">৳{registrationData.paymentInfo.summary.balance || '0.00'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Summary Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div 
              className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Registered Courses</p>
                  <p className="text-3xl font-bold text-gray-900">{activeCourses.length}</p>
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
                  <p className="text-sm text-gray-600 font-medium mb-1">Available Semesters</p>
                  <p className="text-3xl font-bold text-gray-900">{registrationData.semesters.length}</p>
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
                  <p className="text-sm text-gray-600 font-medium mb-1">Balance Due</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ৳{registrationData.paymentInfo.summary.balance || '0.00'}
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {/* Registered Courses Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Registered Courses
              <span className="text-sm font-normal text-gray-500">({activeCourses.length} Active)</span>
            </h2>
            
            {activeCourses.length === 0 ? (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-12 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Registered</h3>
                <p className="text-gray-600">You don't have any active course registrations for this semester.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCourses.slice(0, cardsToShow).map((course, index) => (
                <motion.div 
                  key={index} 
                  className="bg-gray-50/80 backdrop-blur-sm border-2 border-violet-200/50 rounded-xl overflow-hidden hover:border-violet-400/70 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
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
            )}
          </motion.div>

          {/* Available Semesters Section */}
          {/* {registrationData.semesters && registrationData.semesters.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold bg-linear-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Available Semesters
                <span className="text-sm font-normal text-gray-500">({registrationData.semesters.length} Total)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrationData.semesters.slice(0, cardsToShow).map((semester, index) => (
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

          {/* Payment Information Section */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold bg-linear-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credit Breakdown */}
              <motion.div 
                className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Credit Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Lecture</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.lecture}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Science</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.science}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Computer</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.computer}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Language</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.language}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Studio</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.studio}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Health Science</p>
                    <p className="text-xl font-bold text-gray-900">{registrationData.paymentInfo.creditBreakdown.healthScience}</p>
                  </div>
                </div>
              </motion.div>

              {/* Fee Details */}
              <motion.div 
                className="bg-linear-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  Fee Details
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Admission', value: registrationData.paymentInfo.fees.admission },
                    { label: 'Tuition', value: registrationData.paymentInfo.fees.tuition },
                    { label: 'Computer Lab', value: registrationData.paymentInfo.fees.computerLab },
                    { label: 'Science Lab', value: registrationData.paymentInfo.fees.scienceLab },
                    { label: 'Language Lab', value: registrationData.paymentInfo.fees.languageLab },
                    { label: 'Studio', value: registrationData.paymentInfo.fees.studio },
                    { label: 'Health Science', value: registrationData.paymentInfo.fees.healthScience },
                    { label: 'Annual Charge', value: registrationData.paymentInfo.fees.annualCharge },
                    { label: 'Activity Fee', value: registrationData.paymentInfo.fees.activityFee },
                    { label: 'Verification Fee', value: registrationData.paymentInfo.fees.verificationFee },
                    { label: 'Miscellaneous', value: registrationData.paymentInfo.fees.miscellaneous },
                  ].map((fee, index) => (
                    <div key={index} className="flex justify-between items-center bg-white/60 border border-blue-200/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-700">{fee.label}</span>
                      <span className="text-sm font-bold text-gray-900">৳{fee.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Payment Summary */}
              <motion.div 
                className="lg:col-span-2 bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6"
                whileHover={{ scale: 1.01, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Payment Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 border border-blue-200/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-700">৳{registrationData.paymentInfo.summary.total}</p>
                  </div>
                  <div className="bg-white/60 border border-amber-200/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Deduction</p>
                    <p className="text-2xl font-bold text-amber-700">৳{registrationData.paymentInfo.summary.deduction}</p>
                  </div>
                  <div className="bg-white/60 border border-purple-200/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Previous Balance</p>
                    <p className="text-2xl font-bold text-purple-700">৳{registrationData.paymentInfo.summary.previousBalance}</p>
                  </div>
                  <div className="bg-white/60 border border-indigo-200/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Net Total</p>
                    <p className="text-2xl font-bold text-indigo-700">৳{registrationData.paymentInfo.summary.netTotal}</p>
                  </div>
                  <div className="bg-white/60 border border-teal-200/50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-teal-700">৳{registrationData.paymentInfo.summary.amountPaid}</p>
                  </div>
                  <div className="bg-white/80 border-2 border-emerald-300 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-emerald-700">৳{registrationData.paymentInfo.summary.balance}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer/>
    </div>
  )
}

export default Registration