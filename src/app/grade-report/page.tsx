'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import Loading from './loading'
import { FaGraduationCap, FaBook, FaCalendar, FaStar, FaAward, FaChartLine, FaTrophy, FaFire, FaCalculator, FaSync, FaDownload } from 'react-icons/fa'
import { getCachedGradeReport } from '@/lib/prefetch'
import { motion } from 'framer-motion'
import { cacheManager, initAutoLogout } from '@/lib/cacheManager'
import { toPng } from 'html-to-image'
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

  // Refs for each graph component
  const gpaChartRef = useRef<HTMLDivElement>(null)
  const gradeTrendRef = useRef<HTMLDivElement>(null)
  const gradeDistRef = useRef<HTMLDivElement>(null)
  const creditsChartRef = useRef<HTMLDivElement>(null)
  const coursesChartRef = useRef<HTMLDivElement>(null)

  // Function to download chart as image
  const downloadChartAsImage = async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return

    try {
      // Use html-to-image which handles modern CSS better
      const dataUrl = await toPng(ref.current, {
        quality: 1,
        pixelRatio: 2, // Higher quality (2x resolution)
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: false
      })

      const link = document.createElement('a')
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error downloading chart:', error)
      alert('Unable to download chart. Please try again.')
    }
  }

  useEffect(() => {
    // Initialize cache management and auto logout
    initAutoLogout(router)
    
    // Small delay to ensure cache is ready
    const timer = setTimeout(() => {
      fetchGradeReports()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const fetchGradeReports = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        // First check cacheManager (with 5-minute expiry)
        const cachedData = cacheManager.getCache('gradeReportData')
        if (cachedData && cachedData.byCurriculum && cachedData.bySemester) {
          setCurriculumData(cachedData.byCurriculum)
          setSemesterData(cachedData.bySemester)
          setLoading(false)
          return
        }

        // Fallback to localStorage prefetch cache
        const prefetchedData = getCachedGradeReport()
        if (prefetchedData && prefetchedData.byCurriculum && prefetchedData.bySemester) {
          setCurriculumData(prefetchedData.byCurriculum)
          setSemesterData(prefetchedData.bySemester)
          
          // Store in cacheManager for 20-minute expiry
          cacheManager.setCache('gradeReportData', prefetchedData, {
            maxAge: 20 * 60 * 1000,
            onExpiry: () => {
              cacheManager.autoLogout()
            }
          })
          
          setLoading(false)
          return
        }
      }

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
        // Cache with cacheManager with 20-minute expiry and auto-logout
        cacheManager.setCache('gradeReportData', result.data, {
          maxAge: 20 * 60 * 1000, // 20 minutes
          onExpiry: () => {
            cacheManager.autoLogout()
          }
        })
        
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

    // Filter only semesters with valid data
    const validSemesters = semesterData.semesters.filter(sem => 
      sem.courses && sem.courses.length > 0
    )

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

      return {
        // short label for x-axis
        semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
        // full label for tooltip
        full: sem.title.replace(/\*+\s*/, ''),
        cgpa: parseFloat(semesterCgpa.toFixed(2)),
        index: index + 1
      }
    })

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
      
      return {
        semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
        credits,
        index: index + 1
      }
    })

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
        return {
          semester: sem.title.replace(/\*+\s*/, '').substring(0, 15),
          gpa: gpaValue,
          target: 3.5,
          index: index + 1
        }
      })

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
        {/* Header Section - Card Design */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left: Title and subtitle */}
              <div className="md:col-span-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                  {/* <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow"> 
                    <FaGraduationCap className="w-5 h-5" />
                  </span> */}
                  <span>Academic Performance</span>
                </h1>
                <p className="mt-2 text-sm text-gray-600">Overview of your grades, GPA trends and semester summaries.</p>
                <div className="mt-4 flex items-center gap-3">
                  {semesterData?.summary?.cgpa && parseFloat(semesterData.summary.cgpa) >= 3.5 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-semibold border border-yellow-100">
                      <FaTrophy className="w-4 h-4" /> Honor Roll
                    </div>
                  )}
                </div>
              </div>

              {/* Middle: Quick metrics */}
              <div className="md:col-span-1 grid grid-cols-3 gap-4">
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-3 flex flex-col items-start">
                  <p className="text-xs text-gray-600">CGPA</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{semesterData?.summary?.cgpa ?? '—'}</p>
                </div>
                <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-lg p-3 flex flex-col items-start">
                  <p className="text-xs text-gray-600">Credits</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{semesterData?.summary?.completedCredits ?? '—'}</p>
                </div>
                <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-3 flex flex-col items-start">
                  <p className="text-xs text-gray-600">Semesters</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{(semesterData?.semesters?.length ?? 0) || '—'}</p>
                </div>
              </div>

              {/* Right: Actions & small stats */}
              <div className="md:col-span-1 flex items-center justify-end gap-4">
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex">
            <button
              onClick={() => setActiveTab('semester')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative min-h-11 ${
                activeTab === 'semester'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <FaCalendar className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">By Semester</span>
              </div>
              {activeTab === 'semester' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-blue-700"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative border-l border-r border-gray-200 min-h-11 ${
                activeTab === 'curriculum'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <FaBook className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">By Curriculum</span>
              </div>
              {activeTab === 'curriculum' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-green-500 to-green-700"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-all duration-300 relative min-h-11 ${
                activeTab === 'graph'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <FaChartLine className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Analytics</span>
              </div>
              {activeTab === 'graph' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 to-purple-700"></div>
              )}
            </button>
          </div>
        </motion.div>

        {/* Graph Tab Content */}
        {activeTab === 'graph' && graphData && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg">
                    <FaAward className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">{graphData.metrics.aGrades}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">A/A+ Grades</p>
                <div className="text-xs text-gray-500">{graphData.metrics.performanceRate}% Excellence</div>
              </div>

              <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                    <FaBook className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">{graphData.metrics.completedCourses}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Courses Completed</p>
                <div className="text-xs text-gray-500">of {graphData.metrics.totalCourses} total</div>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg">
                    <FaStar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">{graphData.metrics.passRate}%</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Pass Rate</p>
                <div className="text-xs text-gray-500">{graphData.metrics.failedCourses} failed courses</div>
              </div>

              <div className="bg-linear-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-orange-100 p-1.5 sm:p-2 rounded-lg">
                    <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">{semesterData?.summary.cgpa}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">Current CGPA</p>
                <div className="text-xs text-gray-500">{graphData.metrics.bGrades} B grades</div>
              </div>
            </div>

            {/* Charts Grid - Responsive layout */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {/* GPA Trend Chart */}
              <motion.div 
                ref={gpaChartRef}
                className="bg-white rounded-lg border-2 border-blue-200 p-3 sm:p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                    <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="text-sm sm:text-base">GPA Progression Over Time</span>
                  </h3>
                  <button
                    onClick={() => downloadChartAsImage(gpaChartRef, 'gpa-progression')}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                    title="Download as image"
                  >
                    <FaDownload className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                  </button>
                </div>
                {graphData.gpaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280} className="sm:h-[350px]">
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
                        tick={{fontSize: 9, fill: '#1f2937'}} 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                      />
                      <YAxis domain={[0, 4]} tick={{fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value: any) => [`${value}`, 'CGPA']}
                        labelFormatter={(label: string, payload: any) => {
                          const full = payload && payload[0] && payload[0].payload && payload[0].payload.full
                          return full || label
                        }}
                        labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cgpa" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorCgpa)" 
                        name="Semester CGPA" 
                        strokeWidth={2}
                        dot={{ r: 3, stroke: '#1f2937', strokeWidth: 1, fill: '#ffffff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] sm:h-[350px] flex items-center justify-center text-gray-400">
                    <p className="text-sm sm:text-base">No GPA data available yet</p>
                  </div>
                )}
              </motion.div>

              {/* Grade Trend Over Time */}
              <motion.div 
                ref={gradeTrendRef}
                className="bg-white rounded-lg border-2 border-purple-200 p-3 sm:p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                    <FaStar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span className="text-sm sm:text-base">Grade Performance Trend</span>
                  </h3>
                  <button
                    onClick={() => downloadChartAsImage(gradeTrendRef, 'grade-performance-trend')}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
                    title="Download as image"
                  >
                    <FaDownload className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={250} className="sm:h-80">
                  <BarChart data={graphData.gradeTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="semester" 
                      tick={{fontSize: 8, fill: '#1f2937'}} 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      interval={0}
                    />
                    <YAxis tick={{fontSize: 9}} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        fontSize: '11px'
                      }}
                      labelStyle={{
                        color: '#1f2937',
                        fontWeight: 'bold',
                        fontSize: '11px'
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
              </motion.div>

              {/* Grade Distribution */}
              <motion.div 
                ref={gradeDistRef}
                className="bg-white rounded-lg border-2 border-indigo-200 p-3 sm:p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                    <FaAward className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <span className="text-sm sm:text-base">Grade Distribution</span>
                  </h3>
                  <button
                    onClick={() => downloadChartAsImage(gradeDistRef, 'grade-distribution')}
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                    title="Download as image"
                  >
                    <FaDownload className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={240} className="sm:h-[300px]">
                  <PieChart>
                    <Pie
                      data={graphData.gradeDistData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade, percentage }) => `${grade} ${percentage}%`}
                      outerRadius={window.innerWidth < 640 ? 60 : 90}
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
                      contentStyle={{
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Credits per Semester */}
              <motion.div 
                ref={creditsChartRef}
                className="bg-white rounded-lg border-2 border-purple-200 p-3 sm:p-6"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                    <FaBook className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    <span className="text-sm sm:text-base">Credits Earned</span>
                  </h3>
                  <button
                    onClick={() => downloadChartAsImage(creditsChartRef, 'credits-earned')}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
                    title="Download as image"
                  >
                    <FaDownload className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                  </button>
                </div>
                {graphData.creditsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240} className="sm:h-[300px]">
                    <BarChart data={graphData.creditsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="semester" 
                        tick={{fontSize: 8, fill: '#1f2937'}} 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        interval={0}
                      />
                      <YAxis tick={{fontSize: 9}} />
                      <Tooltip 
                        contentStyle={{
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          fontSize: '11px'
                        }}
                        formatter={(value) => [`${value} credits`, 'Credits']}
                        labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: '11px' }}
                      />
                      <Bar dataKey="credits" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {graphData.creditsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${270 - index * 15}, 70%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 sm:h-75 flex items-center justify-center text-gray-400">
                    <p className="text-sm sm:text-base">No credits data available</p>
                  </div>
                )}
              </motion.div>

              {/* Courses per Semester - Full Width */}
              <motion.div 
                ref={coursesChartRef}
                className="lg:col-span-2 bg-white rounded-lg border-2 border-green-200 p-3 sm:p-6"
                whileHover={{ scale: 1.01, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-2">
                    <FaCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <span className="text-sm sm:text-base">Courses per Semester</span>
                  </h3>
                  <button
                    onClick={() => downloadChartAsImage(coursesChartRef, 'courses-per-semester')}
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                    title="Download as image"
                  >
                    <FaDownload className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={260} className="sm:h-[300px]">
                  <BarChart data={graphData.coursesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="semester" 
                      tick={{fontSize: 9, fill: '#1f2937'}} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      interval={0}
                    />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        fontSize: '11px'
                      }}
                      labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: '11px' }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '10px',
                        fontSize: '11px'
                      }} 
                    />
                    <Bar dataKey="courses" fill="#10b981" radius={[4, 4, 0, 0]} name="Total Courses" />
                    <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>
          </motion.div>
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
                <motion.div 
                  key={index} 
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ scale: 1.01, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                >
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
                </motion.div>
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
