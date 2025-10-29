'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import { FaGraduationCap, FaBook, FaCalendar, FaStar, FaAward } from 'react-icons/fa'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

interface Course {
  courseCode: string
  courseTitle: string
  credit: string
  grade: string
  gradePoint: string
}

interface Semester {
  title: string
  courses: Course[]
  gpa?: string
  credits?: string
}

interface GradeReport {
  studentInfo: Record<string, string>
  semesters: Semester[]
  summary: {
    cgpa?: string
    completedCredits?: string
    totalCredits?: string
  }
}

export default function GradeReportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'curriculum' | 'semester'>('curriculum')
  const [curriculumData, setCurriculumData] = useState<GradeReport | null>(null)
  const [semesterData, setSemesterData] = useState<GradeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGradeReports()
  }, [])

  const fetchGradeReports = async () => {
    try {
      setLoading(true)
      setError('')

      // Get auth token
      const authToken = localStorage.getItem('authToken')

      if (!authToken) {
        router.push('/')
        return
      }

      // Fetch both grade reports
      const response = await fetch(`${API_BASE}/grade-report/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const result = await response.json()

      if (result.success) {
        console.log('📊 Grade Reports Received:')
        console.log('By Curriculum:', result.data.byCurriculum)
        console.log('By Semester:', result.data.bySemester)
        console.log('Curriculum Semesters:', result.data.byCurriculum?.semesters?.length || 0)
        console.log('Semester Semesters:', result.data.bySemester?.semesters?.length || 0)
        
        setCurriculumData(result.data.byCurriculum)
        setSemesterData(result.data.bySemester)
      } else {
        throw new Error(result.message || 'Failed to fetch grade reports')
      }
    } catch (err: any) {
      console.error('Grade report fetch error:', err)
      setError(err.message || 'Failed to load grade reports')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    if (!grade) return 'text-gray-600'
    const upperGrade = grade.toUpperCase()
    if (upperGrade === 'A+' || upperGrade === 'A') return 'text-green-600 font-bold'
    if (upperGrade === 'A-' || upperGrade === 'B+') return 'text-blue-600 font-semibold'
    if (upperGrade === 'B' || upperGrade === 'B-') return 'text-indigo-600'
    if (upperGrade === 'C+' || upperGrade === 'C') return 'text-yellow-600'
    if (upperGrade === 'F') return 'text-red-600 font-bold'
    return 'text-gray-600'
  }

  const currentData = activeTab === 'curriculum' ? curriculumData : semesterData

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading grade reports...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={fetchGradeReports}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <FaGraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Grade Report</h1>
              <p className="text-sm text-gray-600">View your academic performance</p>
            </div>
          </div>

          {/* Student Info */}
          {currentData?.studentInfo && Object.keys(currentData.studentInfo).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              {Object.entries(currentData.studentInfo).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium">{key}</span>
                  <span className="text-sm text-gray-800 font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'curriculum'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaBook className="w-4 h-4" />
                <span>By Curriculum</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('semester')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === 'semester'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCalendar className="w-4 h-4" />
                <span>By Semester</span>
              </div>
            </button>
          </div>
        </div>

        {/* CGPA Summary Card */}
        {currentData?.summary?.cgpa && (
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FaAward className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium">Cumulative GPA</p>
                  <p className="text-4xl font-bold">{currentData.summary.cgpa}</p>
                </div>
              </div>
              <div className="flex gap-6">
                {currentData.summary.completedCredits && (
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Completed Credits</p>
                    <p className="text-2xl font-bold">{currentData.summary.completedCredits}</p>
                  </div>
                )}
                {currentData.summary.totalCredits && (
                  <div>
                    <p className="text-sm text-blue-100 font-medium">Total Credits</p>
                    <p className="text-2xl font-bold">{currentData.summary.totalCredits}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Semesters */}
        <div className="space-y-6">
          {currentData?.semesters?.map((semester, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
              {/* Semester Header */}
              <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FaStar className="w-5 h-5" />
                  {semester.title}
                </h3>
                {semester.gpa && (
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-sm text-blue-100 font-medium">GPA: </span>
                    <span className="text-xl font-bold text-white">{semester.gpa}</span>
                  </div>
                )}
              </div>

              {/* Courses Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Course Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Course Title
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Grade Point
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {semester.courses.map((course, courseIndex) => (
                      <tr key={courseIndex} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-800">{course.courseCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{course.courseTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-800">{course.credit}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-lg font-bold ${getGradeColor(course.grade)}`}>
                            {course.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-800">{course.gradePoint}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!currentData?.semesters || currentData.semesters.length === 0) && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-blue-100">
            <FaGraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No grade data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
