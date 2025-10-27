'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

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
      time: string
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
    }>
  }
}

const Home = () => {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE}/user/data`)
      const result = await response.json()

      if (result.success && result.data) {
        setUserData(result.data)
      } else {
        // No user data found, redirect to login
        router.push('/')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      setError('Failed to load user data')
      // Redirect to login on error
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear localStorage if any
    localStorage.removeItem('userData')
    // Redirect to login
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg">{error || 'No user data found'}</p>
          <p className="text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const currentSemester = userData.registration.semesters.find(s => s.selected)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 md:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {userData.studentName || 'Student Portal'}
                </h1>
                <p className="text-blue-100 mt-1">Student ID: {userData.studentId}</p>
                <p className="text-blue-100 text-sm mt-1">{currentSemester?.text || 'Current Semester'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-green-50 border-t border-green-100 px-6 md:px-8 py-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-500 rounded-full p-2 mt-1">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-green-900 mb-2">Microsoft Teams Login Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-green-700 font-medium">Username:</p>
                      <p className="text-green-900 font-semibold bg-white px-3 py-2 rounded border border-green-200 mt-1">
                        {userData.teamsEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700 font-medium">Password:</p>
                      <p className="text-green-900 font-semibold bg-white px-3 py-2 rounded border border-green-200 mt-1">
                        {userData.teamsPassword}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-blue-600">{userData.registration.courses.length}</p>
                </div>
                <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Schedule Days</p>
                  <p className="text-3xl font-bold text-purple-600">{userData.classSchedule.length}</p>
                </div>
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="bg-white border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Classes Today</p>
                  <p className="text-3xl font-bold text-green-600">
                    {userData.classSchedule[0]?.classes.filter(c => c.courseName !== 'No Class On This Day').length || 0}
                  </p>
                </div>
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Schedule Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Class Schedule
              </h2>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              <div className="space-y-4">
                {userData.classSchedule.map((schedule, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-bold text-gray-800 mb-2">{schedule.date}</h3>
                    {schedule.classes.length > 0 ? (
                      <div className="space-y-3">
                        {schedule.classes.map((classItem, classIndex) => (
                          <div key={classIndex} className="bg-gray-50 rounded-lg p-3">
                            {classItem.courseName === 'No Class On This Day' ? (
                              <p className="text-gray-500 italic">{classItem.courseName}</p>
                            ) : (
                              <>
                                <p className="font-semibold text-blue-700">{classItem.courseName}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                  {classItem.time && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {classItem.time}
                                    </div>
                                  )}
                                  {classItem.room && (
                                    <div className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                      Room {classItem.room}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No classes scheduled</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Registered Courses Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Registered Courses
                </h2>
              </div>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              <div className="space-y-4">
                {userData.registration.courses.map((course, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">
                            {course.courseCode}
                          </span>
                          <span className="text-xs text-gray-500">{course.sectionStatus}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{course.courseName}</h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {course.statusLabels && course.statusLabels.map((label, labelIndex) => (
                        <span
                          key={labelIndex}
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            label.type === 'success'
                              ? 'bg-green-100 text-green-700'
                              : label.type === 'danger'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {label.text}
                        </span>
                      ))}
                    </div>

                    {course.result && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Result: <span className="font-medium text-gray-800">{course.result}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Semester Information */}
        {userData.registration.semesters && userData.registration.semesters.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-6">
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Available Semesters
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {userData.registration.semesters.map((semester, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      semester.selected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {semester.selected && (
                        <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm font-medium ${
                        semester.selected ? 'text-teal-700' : 'text-gray-700'
                      }`}>
                        {semester.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home