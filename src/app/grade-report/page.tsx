'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import Loading from './loading'
import { FaGraduationCap, FaBook, FaCalendar, FaStar, FaAward, FaChartLine, FaTrophy, FaFire, FaCalculator, FaSync } from 'react-icons/fa'
import { getCachedGradeReport } from '@/lib/prefetch'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from 'recharts'
import Footer from '@/components/Footer/Footer'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

// Global cache for grade report data
let gradeReportCache: {
  curriculumData: GradeReport | null
  semesterData: GradeReport | null
  timestamp: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
  const [activeTab, setActiveTab] = useState<'curriculum' | 'semester' | 'graph'>('semester')
  const [curriculumData, setCurriculumData] = useState<GradeReport | null>(null)
  const [semesterData, setSemesterData] = useState<GradeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGradeReports()
  }, [])

  const fetchGradeReports = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')

      // Check localStorage cache first (from prefetch)
      if (!forceRefresh) {
        const cachedData = getCachedGradeReport()
        if (cachedData) {
          console.log('📊 Using prefetched grade report data from localStorage')
          setCurriculumData(cachedData.byCurriculum)
          setSemesterData(cachedData.bySemester)
          
          // Also update global cache
          gradeReportCache = {
            curriculumData: cachedData.byCurriculum,
            semesterData: cachedData.bySemester,
            timestamp: Date.now()
          }
          
          setLoading(false)
          return
        }
      }

      // Check global cache second (unless force refresh)
      const now = Date.now()
      if (!forceRefresh && gradeReportCache && (now - gradeReportCache.timestamp) < CACHE_DURATION) {
        console.log('📊 Using cached grade report data (cache age:', Math.round((now - gradeReportCache.timestamp) / 1000), 'seconds)')
        setCurriculumData(gradeReportCache.curriculumData)
        setSemesterData(gradeReportCache.semesterData)
        setLoading(false)
        return
      }

      console.log('📊 Fetching fresh grade report data from API')

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
        
        // Cache the data in global cache
        gradeReportCache = {
          curriculumData: result.data.byCurriculum,
          semesterData: result.data.bySemester,
          timestamp: now
        }

        // Also cache in localStorage
        localStorage.setItem('gradeReportData', JSON.stringify(result.data))
        localStorage.setItem('gradeReportTimestamp', now.toString())
        
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

  const getGradeBgColor = (grade: string) => {
    if (!grade) return 'bg-gray-100'
    const upperGrade = grade.toUpperCase()
    if (upperGrade === 'A+' || upperGrade === 'A') return 'bg-green-100'
    if (upperGrade === 'A-' || upperGrade === 'B+') return 'bg-blue-100'
    if (upperGrade === 'B' || upperGrade === 'B-') return 'bg-indigo-100'
    if (upperGrade === 'C+' || upperGrade === 'C') return 'bg-yellow-100'
    if (upperGrade === 'F') return 'bg-red-100'
    return 'bg-gray-100'
  }

  // Prepare graph data from semester data
  const prepareGraphData = () => {
    if (!semesterData?.semesters) return null

    console.log('🔍 Preparing graph data...')
    console.log('Semester Data:', semesterData)

    // Filter only semesters with valid data
    const validSemesters = semesterData.semesters.filter(sem => 
      sem.courses && sem.courses.length > 0
    )

    console.log('Valid Semesters:', validSemesters.length)

    // GPA trend data - calculate semester-wise CGPA from course data
    // Note: some backends provide `gradePoint` as per-credit (<=4.00) or as total points for the course (>4.00).
    // Detect and handle both formats: if gradePoint <= 4 assume it's per-credit; otherwise treat it as total points.
    const gpaData = validSemesters.map((sem, index) => {
      let totalGradePoints = 0
      let totalCredits = 0

      // Calculate CGPA for this semester based on its courses
      sem.courses.forEach(course => {
        const grade = course.grade?.toUpperCase()?.trim()
        // Only include courses with valid grades (exclude W, F, UW, -)
        if (grade && grade !== 'W' && grade !== 'F' && grade !== 'UW' && grade !== '-') {
          const rawGp = parseFloat(course.gradePoint || '0')
          const credit = parseFloat(course.credit || '0')

          // Determine whether rawGp is per-credit (<=4) or total points (>4)
          let pointsForCourse = 0
          if (!isNaN(rawGp)) {
            if (rawGp <= 4.01) {
              // gradePoint is per-credit
              pointsForCourse = rawGp * credit
            } else {
              // gradePoint already represents total points for the course
              pointsForCourse = rawGp
            }
          }

          if (pointsForCourse > 0 && credit > 0) {
            totalGradePoints += pointsForCourse
            totalCredits += credit
          }
        }
      })

      const semesterCgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0

      console.log(`Semester ${sem.title}: Total Grade Points=${totalGradePoints.toFixed(2)}, Total Credits=${totalCredits}, CGPA=${semesterCgpa.toFixed(2)} (Grade Points / Credits)`)

      return {
        // short label for x-axis
        semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
        // full label for tooltip
        full: sem.title.replace(/\*+\s*/, ''),
        cgpa: parseFloat(semesterCgpa.toFixed(2)),
        index: index + 1
      }
    })

    console.log('GPA Data:', gpaData)

    // Grade distribution - count all grade types dynamically
    const gradeDistribution: Record<string, number> = {}
    validSemesters.forEach(sem => {
      sem.courses.forEach(course => {
        const grade = course.grade?.toUpperCase()?.trim()
        if (grade && grade !== '-' && grade !== 'W' && grade !== '') {
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1
        }
      })
    })

    console.log('Grade Distribution:', gradeDistribution)

    // Define color mapping for all grades
    const gradeColors: Record<string, string> = {
      'A+': '#16a34a',
      'A': '#22c55e',
      'A-': '#3b82f6',
      'B+': '#2563eb',
      'B': '#6366f1',
      'B-': '#8b5cf6',
      'C+': '#eab308',
      'C': '#f59e0b',
      'C-': '#f97316',
      'D+': '#fb923c',
      'D': '#f87171',
      'D-': '#ef4444',
      'F': '#dc2626'
    }

    const gradeDistData = Object.entries(gradeDistribution)
      .sort((a, b) => b[1] - a[1])
      .map(([grade, count]) => ({
        grade,
        count,
        percentage: ((count / Object.values(gradeDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
        color: gradeColors[grade] || '#6b7280'
      }))

    // Credits per semester - check both credits and calculate from courses
    // Exclude W (Withdraw), F (Fail), UW (Unofficial Withdraw) from credit calculation
    const creditsData = validSemesters.map((sem, index) => {
      let credits = 0
      
      // Try to get from semester.credits first
      if (sem.credits && sem.credits !== '0') {
        credits = parseFloat(sem.credits)
      } else {
        // Calculate from courses, excluding W, F, UW grades
        credits = sem.courses.reduce((sum, course) => {
          const grade = course.grade?.toUpperCase()?.trim()
          // Only count credits if grade is not W, F, or UW
          if (grade && grade !== 'W' && grade !== 'F' && grade !== 'UW' && grade !== '-') {
            const credit = parseFloat(course.credit || '0')
            return sum + credit
          }
          return sum
        }, 0)
      }
      
      console.log(`Semester ${sem.title}: Credits=${credits}`)
      
      return {
        semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
        credits,
        index: index + 1
      }
    })

    console.log('Credits Data:', creditsData)

    // Courses per semester
    const coursesData = validSemesters.map((sem, index) => ({
      semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
      courses: sem.courses.length,
      completed: sem.courses.filter(c => c.grade && c.grade !== '-' && c.grade !== 'W').length,
      index: index + 1
    }))

    // GPA comparison data - only include semesters with actual GPA
    const gpaComparison = validSemesters
      .filter(sem => sem.gpa && parseFloat(sem.gpa) > 0)
      .map((sem, index) => {
        const gpaValue = parseFloat(sem.gpa || '0')
        console.log(`GPA Comparison - ${sem.title}: ${gpaValue}`)
        return {
          semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
          gpa: gpaValue,
          target: 3.5,
          index: index + 1
        }
      })

    console.log('GPA Comparison Data:', gpaComparison)

    // Performance metrics
    const totalCourses = validSemesters.reduce((sum, sem) => sum + sem.courses.length, 0)
    const completedCourses = validSemesters.reduce((sum, sem) => 
      sum + sem.courses.filter(c => c.grade && c.grade !== '-' && c.grade !== 'W').length, 0)
    const aGrades = validSemesters.reduce((sum, sem) => 
      sum + sem.courses.filter(c => c.grade === 'A+' || c.grade === 'A').length, 0)
    const bGrades = validSemesters.reduce((sum, sem) => 
      sum + sem.courses.filter(c => c.grade === 'B+' || c.grade === 'B' || c.grade === 'B-' || c.grade === 'A-').length, 0)
    const failedCourses = validSemesters.reduce((sum, sem) => 
      sum + sem.courses.filter(c => c.grade === 'F').length, 0)

    // Grade trend over time - ALL GRADES DYNAMICALLY
    const gradeTrend = validSemesters.map((sem, index) => {
      const gradeCount: Record<string, number> = {}
      
      // Count all grades in this semester
      sem.courses.forEach(course => {
        const grade = course.grade?.toUpperCase()?.trim()
        if (grade && grade !== '-' && grade !== 'W' && grade !== '') {
          gradeCount[grade] = (gradeCount[grade] || 0) + 1
        }
      })
      
      return {
        semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
        ...gradeCount,
        index: index + 1
      }
    })

    console.log('Grade Trend Data:', gradeTrend)

    const result = {
      gpaData,
      gradeDistData,
      creditsData,
      coursesData,
      gpaComparison,
      gradeTrend,
      metrics: {
        totalCourses,
        completedCourses,
        aGrades,
        bGrades,
        failedCourses,
        performanceRate: completedCourses > 0 ? ((aGrades / completedCourses) * 100).toFixed(1) : '0',
        passRate: completedCourses > 0 ? (((completedCourses - failedCourses) / completedCourses) * 100).toFixed(1) : '0'
      }
    }

    console.log('Final Graph Data:', result)
    return result
  }

  const graphData = prepareGraphData()

  const currentData = activeTab === 'curriculum' ? curriculumData : 
                      activeTab === 'semester' ? semesterData : null

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={() => fetchGradeReports(true)}
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                Academic Performance
                {semesterData?.summary?.cgpa && parseFloat(semesterData.summary.cgpa) >= 3.5 && (
                  <FaTrophy className="w-6 h-6 text-yellow-500" />
                )}
              </h1>
              <p className="text-gray-600 font-medium">Track your academic journey and achievements</p>
            </div>
            {semesterData?.summary?.cgpa && (
              <div className="flex gap-4 items-center">
                <div className="bg-white border border-gray-200 rounded-lg px-5 py-3">
                  <p className="text-sm text-gray-600 font-medium mb-1">CGPA</p>
                  <p className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    {semesterData.summary.cgpa}
                    {parseFloat(semesterData.summary.cgpa) >= 3.5 && <FaFire className="w-5 h-5 text-orange-500" />}
                  </p>
                </div>
                {semesterData.summary.completedCredits && (
                  <div className="bg-white border border-gray-200 rounded-lg px-5 py-3">
                    <p className="text-sm text-gray-600 font-medium mb-1">Credits</p>
                    <p className="text-3xl font-bold text-gray-900">{semesterData.summary.completedCredits}</p>
                  </div>
                )}
                <button
                  onClick={() => fetchGradeReports(true)}
                  disabled={loading}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  <FaSync className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('semester')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'semester'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCalendar className="w-4 h-4" />
                <span>By Semester</span>
              </div>
              {activeTab === 'semester' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-blue-700"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 relative border-l border-r border-gray-200 ${
                activeTab === 'curriculum'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaBook className="w-4 h-4" />
                <span>By Curriculum</span>
              </div>
              {activeTab === 'curriculum' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 to-green-700"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'graph'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaChartLine className="w-4 h-4" />
                <span>Analytics</span>
              </div>
              {activeTab === 'graph' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-purple-700"></div>
              )}
            </button>
          </div>
        </div>

        {/* Graph Tab Content */}
        {activeTab === 'graph' && graphData && (
          <div className="space-y-6">
            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaAward className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{graphData.metrics.aGrades}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">A/A+ Grades</p>
                <div className="text-xs text-gray-500">{graphData.metrics.performanceRate}% Excellence</div>
              </div>

              <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FaBook className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{graphData.metrics.completedCourses}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Courses Completed</p>
                <div className="text-xs text-gray-500">of {graphData.metrics.totalCourses} total</div>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FaStar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{graphData.metrics.passRate}%</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Pass Rate</p>
                <div className="text-xs text-gray-500">{graphData.metrics.failedCourses} failed courses</div>
              </div>

              <div className="bg-linear-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <FaChartLine className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{semesterData?.summary.cgpa}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Current CGPA</p>
                <div className="text-xs text-gray-500">{graphData.metrics.bGrades} B grades</div>
              </div>
            </div>

            {/* GPA Trend Chart */}
            <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
              <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FaChartLine className="w-5 h-5 text-blue-600" />
                GPA Progression Over Time
              </h3>
              {graphData.gpaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={graphData.gpaData}>
                    <defs>
                      <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="semester" 
                      tick={{fontSize: 11}} 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis domain={[0, 4]} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any) => [`${value}`, 'CGPA']}
                      // show full semester name in bold dark gray
                      labelFormatter={(label: string, payload: any) => {
                        const full = payload && payload[0] && payload[0].payload && payload[0].payload.full
                        return full || label
                      }}
                      labelStyle={{ color: '#1f2937', fontWeight: 700 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cgpa" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorCgpa)" 
                      name="Semester CGPA" 
                      strokeWidth={2}
                      dot={{ r: 4, stroke: '#1f2937', strokeWidth: 1, fill: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-400">
                  <p>No GPA data available yet</p>
                </div>
              )}
            </div>

            {/* Grade Trend Over Time */}
            <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
              <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FaStar className="w-5 h-5 text-purple-600" />
                Grade Performance Trend (All Grades)
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={graphData.gradeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="semester" 
                    tick={{fontSize: 10, fill: '#1f2937'}} 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff'
                    }}
                    labelStyle={{
                      color: '#1f2937',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  />
                  <Bar dataKey="A+" stackId="a" fill="#16a34a" />
                  <Bar dataKey="A" stackId="a" fill="#22c55e" />
                  <Bar dataKey="A-" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="B+" stackId="a" fill="#2563eb" />
                  <Bar dataKey="B" stackId="a" fill="#6366f1" />
                  <Bar dataKey="B-" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="C+" stackId="a" fill="#eab308" />
                  <Bar dataKey="C" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="C-" stackId="a" fill="#f97316" />
                  <Bar dataKey="D+" stackId="a" fill="#fb923c" />
                  <Bar dataKey="D" stackId="a" fill="#f87171" />
                  <Bar dataKey="D-" stackId="a" fill="#ef4444" />
                  <Bar dataKey="F" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grade Distribution */}
              <div className="bg-white rounded-lg border-2 border-indigo-200 p-6">
                <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FaAward className="w-5 h-5 text-indigo-600" />
                  Overall Grade Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={graphData.gradeDistData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ grade, count, percentage }) => `${grade}: ${count} (${percentage}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {graphData.gradeDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} courses (${props.payload.percentage}%)`,
                        `Grade ${props.payload.grade}`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Credits per Semester */}
              <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
                <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FaBook className="w-5 h-5 text-purple-600" />
                  Credits Earned per Semester
                </h3>
                {graphData.creditsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={graphData.creditsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="semester" 
                        tick={{fontSize: 10}} 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis tick={{fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}}
                        formatter={(value) => [`${value} credits`, 'Credits']}
                        labelStyle={{ color: '#1f2937', fontWeight: 700 }}
                      />
                      <Bar dataKey="credits" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {graphData.creditsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${270 - index * 15}, 70%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    <p>No credits data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Courses per Semester - Full Width */}
            <div className="bg-white rounded-lg border-2 border-green-200 p-6">
              <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FaCalendar className="w-5 h-5 text-green-600" />
                Courses per Semester
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData.coursesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="semester" 
                    tick={{fontSize: 10}} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0}
                  />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb'}} labelStyle={{ color: '#1f2937', fontWeight: 700 }} />
                  <Legend wrapperStyle={{paddingTop: '15px'}} />
                  <Bar dataKey="courses" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Courses" />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Curriculum & Semester Tabs Content */}
        {(activeTab === 'curriculum' || activeTab === 'semester') && currentData && (
          <>
            {/* Student Info Card */}
            {currentData?.studentInfo && Object.keys(currentData.studentInfo).length > 0 && (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 mb-6">
                <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FaGraduationCap className="w-5 h-5 text-blue-600" />
                  Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(currentData.studentInfo)
                    .filter(([key]) => key.toLowerCase().includes('name') || key.toLowerCase().includes('id'))
                    .map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 font-medium mb-1">{key}</p>
                        <p className="text-sm text-gray-900 font-bold">{value}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Semesters */}
            <div className="space-y-6">
              {currentData?.semesters?.map((semester, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Semester Header */}
                  <div className={`bg-linear-to-r ${
                    index % 4 === 0 ? 'from-blue-50 to-indigo-50 border-blue-200' :
                    index % 4 === 1 ? 'from-green-50 to-emerald-50 border-green-200' :
                    index % 4 === 2 ? 'from-purple-50 to-pink-50 border-purple-200' :
                    'from-orange-50 to-red-50 border-orange-200'
                  } border-b px-6 py-4 flex items-center justify-between`}>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FaStar className={`w-5 h-5 ${
                        index % 4 === 0 ? 'text-blue-600' :
                        index % 4 === 1 ? 'text-green-600' :
                        index % 4 === 2 ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                      {semester.title}
                    </h3>
                    {semester.gpa && (
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                        <span className="text-sm text-gray-600 font-medium mr-2">GPA:</span>
                        <span className="text-xl font-bold text-gray-900">{semester.gpa}</span>
                      </div>
                    )}
                  </div>

                  {/* Courses Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Course Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Course Title
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Credit
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Grade Point
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {semester.courses.map((course, courseIndex) => (
                          <tr key={courseIndex} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                {course.courseCode}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900 font-medium">{course.courseTitle}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-gray-700">{course.credit || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-lg font-black ${getGradeColor(course.grade)}`}>
                                {course.grade || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-bold text-gray-800">{course.gradePoint || '-'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Semester Summary Row */}
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <FaCalculator className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-sm font-bold text-gray-800">Semester Summary</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-sm font-bold text-gray-900">
                                {(() => {
                                  const totalCredits = semester.courses.reduce((sum, course) => {
                                    const grade = course.grade?.toUpperCase()?.trim()
                                    if (grade && grade !== 'W' && grade !== 'F' && grade !== 'UW' && grade !== '-') {
                                      return sum + parseFloat(course.credit || '0')
                                    }
                                    return sum
                                  }, 0)
                                  return totalCredits.toFixed(1)
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-white rounded-md px-2 py-1 shadow-sm">
                              <span className="text-sm font-bold text-gray-800">
                                {(() => {
                                  let totalGradePoints = 0
                                  let totalCredits = 0

                                  semester.courses.forEach(course => {
                                    const grade = course.grade?.toUpperCase()?.trim()
                                    if (grade && grade !== 'W' && grade !== 'F' && grade !== 'UW' && grade !== '-') {
                                      const rawGp = parseFloat(course.gradePoint || '0')
                                      const credit = parseFloat(course.credit || '0')

                                      // if rawGp <= 4 treat as per-credit, otherwise treat as total points
                                      let pointsForCourse = 0
                                      if (!isNaN(rawGp)) {
                                        if (rawGp <= 4.01) {
                                          pointsForCourse = rawGp * credit
                                        } else {
                                          pointsForCourse = rawGp
                                        }
                                      }

                                      if (pointsForCourse > 0 && credit > 0) {
                                        totalGradePoints += pointsForCourse
                                        totalCredits += credit
                                      }
                                    }
                                  })

                                  const averageCgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0
                                  return averageCgpa.toFixed(2)
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="bg-white rounded-md px-2 py-1 shadow-sm">
                              <span className="text-sm font-bold text-gray-800">
                                {(() => {
                                  let totalGradePoints = 0

                                  semester.courses.forEach(course => {
                                    const grade = course.grade?.toUpperCase()?.trim()
                                    if (grade && grade !== 'W' && grade !== 'F' && grade !== 'UW' && grade !== '-') {
                                      const rawGp = parseFloat(course.gradePoint || '0')
                                      const credit = parseFloat(course.credit || '0')

                                      let pointsForCourse = 0
                                      if (!isNaN(rawGp)) {
                                        if (rawGp <= 4.01) {
                                          pointsForCourse = rawGp * credit
                                        } else {
                                          pointsForCourse = rawGp
                                        }
                                      }

                                      if (pointsForCourse > 0) {
                                        totalGradePoints += pointsForCourse
                                      }
                                    }
                                  })

                                  return totalGradePoints.toFixed(2)
                                })()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {(activeTab === 'curriculum' || activeTab === 'semester') && (!currentData?.semesters || currentData.semesters.length === 0) && (
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaGraduationCap className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Grade Data Available</h3>
            <p className="text-gray-600">Your academic records will appear here once available.</p>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  )
}
