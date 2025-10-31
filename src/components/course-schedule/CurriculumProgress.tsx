'use client'

import React, { useState, useEffect } from 'react'
import { FiCheckCircle, FiCircle, FiBook, FiAward, FiTrendingUp } from 'react-icons/fi'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

interface CompletedCourse {
  code: string
  title: string
  credit: string
  grade: string
  gradePoint?: string
  semester: string
}

interface IncompleteCourse {
  code: string
  name: string
  credit: string
  prerequisites: string[]
  semester?: string
  major?: string
}

interface SemesterProgress {
  completed: any[]
  incomplete: any[]
  completionPercentage: number
}

interface CurrentSemesterCourse {
  code: string
  name: string
  credits: string
  status: string
  timeInfo: Array<{
    start: string
    end: string
    room: string
  }>
  isDropped: boolean
}

interface CurriculumProgressData {
  completedCourses: CompletedCourse[]
  incompleteCourses: IncompleteCourse[]
  currentSemesterCourses: CurrentSemesterCourse[]
  semesters: Record<string, SemesterProgress>
  majors: Record<string, SemesterProgress>
  summary: {
    totalCreditsCompleted: number
    totalCoursesCompleted: number
    totalCoursesInCurriculum: number
    completionPercentage: number
    cgpa: string
  }
}

interface CurriculumProgressProps {
  onCourseSelect?: (courseName: string) => void
  selectedCourses?: string[]
}

const CurriculumProgress: React.FC<CurriculumProgressProps> = ({ onCourseSelect, selectedCourses = [] }) => {
  const [progressData, setProgressData] = useState<CurriculumProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'completed' | 'current' | 'incomplete' | 'unlocked'>('unlocked')
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCurriculumProgress()
  }, [])

  const fetchCurriculumProgress = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Please login to view your curriculum progress')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/curriculum/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch curriculum progress')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setProgressData(result.data)
      } else {
        throw new Error(result.message || 'Failed to load curriculum progress')
      }
    } catch (err: any) {
      console.error('Error fetching curriculum progress:', err)
      setError(err.message || 'Failed to load curriculum progress')
    } finally {
      setLoading(false)
    }
  }

  const toggleSemester = (semesterName: string) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(semesterName)) {
        newSet.delete(semesterName)
      } else {
        newSet.add(semesterName)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="text-center text-red-600">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!progressData) {
    return null
  }

  const { summary, completedCourses, incompleteCourses, semesters, currentSemesterCourses } = progressData

  // Calculate unlocked courses
  const getUnlockedCourses = (): IncompleteCourse[] => {
    // Get completed course codes
    const completedCodes = new Set(completedCourses.map(c => c.code))
    
    // Get current semester active course codes (excluding dropped)
    const activeCodes = new Set(
      currentSemesterCourses
        .filter(c => !c.isDropped)
        .map(c => c.code)
    )
    
    // Filter incomplete courses
    return incompleteCourses.filter(course => {
      // Exclude elective placeholders
      const excludePatterns = ['CSE ELECTIVE', 'CSE MAJOR', 'COS ELECTIVE']
      if (excludePatterns.some(pattern => course.name.includes(pattern))) {
        return false
      }
      
      // Check if all prerequisites are met
      if (!course.prerequisites || course.prerequisites.length === 0) {
        return true // No prerequisites, so it's unlocked
      }
      
      // Check if all prerequisites are either completed or currently active
      return course.prerequisites.every(prereq => 
        completedCodes.has(prereq) || activeCodes.has(prereq)
      )
    })
  }

  const unlockedCourses = getUnlockedCourses()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
      {/* Header with Summary */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <FiAward className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
          Curriculum Progress
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-blue-700 mb-1">CGPA</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-900">{summary.cgpa}</div>
          </div>
          
          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-green-700 mb-1">Completed</div>
            <div className="text-xl sm:text-2xl font-bold text-green-900">{summary.totalCoursesCompleted}</div>
          </div>
          
          <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-orange-700 mb-1">Progress</div>
            <div className="text-xl sm:text-2xl font-bold text-orange-900">{summary.completionPercentage}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-linear-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${summary.completionPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{summary.totalCoursesCompleted} of {summary.totalCoursesInCurriculum} courses</span>
          <span>{summary.completionPercentage}% complete</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('unlocked')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'unlocked'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Unlocked ({unlockedCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'current'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Current Semester ({progressData.currentSemesterCourses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Completed ({completedCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('incomplete')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'incomplete'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Incomplete ({Object.values(semesters).reduce((total, semester) => total + semester.incomplete.length, 0)})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        {activeTab === 'unlocked' ? (
          <div className="space-y-3">
            {unlockedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No unlocked courses available</p>
            ) : (
              unlockedCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <FiTrendingUp className="text-purple-600 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {course.code}
                          </h4>
                          {course.semester && (
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                              {course.semester}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{course.name}</p>
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <FiCheckCircle className="shrink-0" />
                            <span>Prerequisites met: {course.prerequisites.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <button
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors shrink-0 ${
                          selectedCourses.includes(course.name)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                        onClick={() => {
                          if (onCourseSelect && !selectedCourses.includes(course.name)) {
                            onCourseSelect(course.name)
                          }
                        }}
                        disabled={selectedCourses.includes(course.name)}
                      >
                        {selectedCourses.includes(course.name) ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'current' ? (
          <div className="space-y-3">
            {!progressData.currentSemesterCourses || progressData.currentSemesterCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No courses registered for current semester</p>
            ) : (
              progressData.currentSemesterCourses.map((course, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    course.isDropped
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {course.code}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          course.isDropped
                            ? 'bg-red-600 text-white'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {course.status}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{course.name}</p>
                      
                      {/* Time Information */}
                      {course.timeInfo && course.timeInfo.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {course.timeInfo.map((time, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{time.start} - {time.end}</span>
                              <span className="text-gray-400">|</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Room {time.room}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'completed' ? (
          <div className="space-y-2">
            {completedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed courses yet</p>
            ) : (
              // Group completed courses by semester
              (() => {
                const coursesBySemester: Record<string, CompletedCourse[]> = {}
                
                completedCourses.forEach(course => {
                  const sem = course.semester || 'Unknown Semester'
                  if (!coursesBySemester[sem]) {
                    coursesBySemester[sem] = []
                  }
                  coursesBySemester[sem].push(course)
                })

                return Object.entries(coursesBySemester).map(([semesterName, semesterCourses]) => {
                  const isExpanded = expandedSemesters.has(semesterName)
                  
                  return (
                    <div key={semesterName} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSemester(semesterName)}
                        className="w-full px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FiCheckCircle className="text-green-600" />
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            {semesterName}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({semesterCourses.length} courses)
                          </span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-3 space-y-2 bg-white">
                          {semesterCourses.map((course, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:shadow-md transition-shadow"
                            >
                              <FiCheckCircle className="text-green-600 mt-1 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                      {course.code}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{course.title}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                                      {course.grade}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              })()
            )}
          </div>
        ) : activeTab === 'incomplete' ? (
          <div className="space-y-2">
            {Object.entries(semesters).map(([semesterName, semesterData]) => {
              if (semesterData.incomplete.length === 0) return null
              
              const isExpanded = expandedSemesters.has(semesterName)
              
              return (
                <div key={semesterName} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSemester(semesterName)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FiBook className="text-gray-600" />
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {semesterName}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({semesterData.incomplete.length} courses)
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-white">
                      {semesterData.incomplete.map((course, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                        >
                          <FiCircle className="text-orange-600 mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {course.code}
                                </h4>
                                <p className="text-xs text-gray-600 mt-0.5">{course.name}</p>
                              </div>
                            </div>
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Prerequisites: {course.prerequisites.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            
            {Object.values(semesters).reduce((total, semester) => total + semester.incomplete.length, 0) === 0 && (
              <p className="text-gray-500 text-center py-8">All courses completed! 🎉</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {unlockedCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No unlocked courses available</p>
            ) : (
              unlockedCourses.map((course, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <FiTrendingUp className="text-purple-600 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {course.code}
                          </h4>
                          {course.semester && (
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                              {course.semester}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{course.name}</p>
                        {course.prerequisites && course.prerequisites.length > 0 && (
                          <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <FiCheckCircle className="shrink-0" />
                            <span>Prerequisites met: {course.prerequisites.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CurriculumProgress
