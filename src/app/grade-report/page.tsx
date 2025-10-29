'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import { FaGraduationCap, FaBook, FaCalendar, FaStar, FaAward, FaChartLine, FaTrophy, FaFire } from 'react-icons/fa'
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header with Animated Gradient */}
        <div className="relative bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-linear-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                <FaGraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
                  Academic Performance
                  <FaTrophy className="w-6 h-6 text-yellow-300 animate-bounce" />
                </h1>
                <p className="text-blue-100 text-sm">Track your academic journey and achievements</p>
              </div>
            </div>

            {/* Quick Stats */}
            {semesterData?.summary?.cgpa && (
              <div className="flex gap-6 bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 shadow-lg">
                <div className="text-center">
                  <p className="text-xs text-blue-200 font-medium mb-1">CGPA</p>
                  <p className="text-3xl font-bold text-white flex items-center gap-1">
                    {semesterData.summary.cgpa}
                    {parseFloat(semesterData.summary.cgpa) >= 3.5 && <FaFire className="w-5 h-5 text-orange-400" />}
                  </p>
                </div>
                {semesterData.summary.completedCredits && (
                  <div className="text-center border-l border-white/20 pl-6">
                    <p className="text-xs text-blue-200 font-medium mb-1">Credits</p>
                    <p className="text-3xl font-bold text-white">{semesterData.summary.completedCredits}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('semester')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'semester'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaCalendar className="w-5 h-5" />
                <span>By Semester</span>
              </div>
              {activeTab === 'semester' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all duration-300 relative border-l border-r border-gray-200 ${
                activeTab === 'curriculum'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaBook className="w-5 h-5" />
                <span>By Curriculum</span>
              </div>
              {activeTab === 'curriculum' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('graph')}
              className={`flex-1 px-6 py-5 text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'graph'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FaChartLine className="w-5 h-5" />
                <span>Analytics</span>
              </div>
              {activeTab === 'graph' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Graph Tab Content */}
        {activeTab === 'graph' && graphData && (
          <div className="space-y-8">
            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <FaAward className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{graphData.metrics.aGrades}</span>
                </div>
                <p className="text-sm text-green-100 font-medium">A/A+ Grades</p>
                <div className="mt-2 text-xs text-green-200">{graphData.metrics.performanceRate}% Excellence</div>
              </div>

              <div className="bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <FaBook className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{graphData.metrics.completedCourses}</span>
                </div>
                <p className="text-sm text-blue-100 font-medium">Courses Completed</p>
                <div className="mt-2 text-xs text-blue-200">of {graphData.metrics.totalCourses} total</div>
              </div>

              <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <FaStar className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{graphData.metrics.passRate}%</span>
                </div>
                <p className="text-sm text-purple-100 font-medium">Pass Rate</p>
                <div className="mt-2 text-xs text-purple-200">{graphData.metrics.failedCourses} failed courses</div>
              </div>

              <div className="bg-linear-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <FaChartLine className="w-8 h-8 opacity-80" />
                  <span className="text-3xl font-bold">{semesterData?.summary.cgpa}</span>
                </div>
                <p className="text-sm text-orange-100 font-medium">Current CGPA</p>
                <div className="mt-2 text-xs text-orange-200">{graphData.metrics.bGrades} B grades</div>
              </div>
            </div>

            {/* GPA Trend Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                GPA Progression Over Time
              </h3>
              {graphData.gpaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
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
                      height={120}
                      interval={0}
                    />
                    <YAxis domain={[0, 4]} tick={{fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '12px', 
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
                      strokeWidth={3}
                      dot={{ r: 5, stroke: '#1f2937', strokeWidth: 1, fill: '#ffffff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-400">
                  <p>No GPA data available yet</p>
                </div>
              )}
            </div>

            {/* Grade Trend Over Time */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaStar className="text-purple-600" />
                Grade Performance Trend (All Grades)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={graphData.gradeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="semester" 
                    tick={{fontSize: 11, fill: '#1f2937'}} 
                    angle={-45} 
                    textAnchor="end" 
                    height={120}
                    interval={0}
                  />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '12px', 
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#ffffff'
                    }}
                    labelStyle={{
                      color: '#1f2937',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
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
                  <Bar dataKey="F" stackId="a" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grade Distribution */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaAward className="text-indigo-600" />
                  Overall Grade Distribution
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={graphData.gradeDistData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ grade, count, percentage }) => `${grade}: ${count} (${percentage}%)`}
                      outerRadius={110}
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
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaBook className="text-purple-600" />
                  Credits Earned per Semester
                </h3>
                {graphData.creditsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={graphData.creditsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="semester" 
                        tick={{fontSize: 11}} 
                        angle={-45} 
                        textAnchor="end" 
                        height={120}
                        interval={0}
                      />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb'}}
                        formatter={(value) => [`${value} credits`, 'Credits']}
                        labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: 14 }}
                      />
                      <Bar dataKey="credits" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                        {graphData.creditsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${270 - index * 15}, 70%, 60%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-gray-400">
                    <p>No credits data available</p>
                  </div>
                )}
              </div>

              {/* Courses per Semester */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FaCalendar className="text-green-600" />
                  Courses per Semester
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={graphData.coursesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="semester" 
                      tick={{fontSize: 11}} 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      interval={0}
                    />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb'}} labelStyle={{ color: '#1f2937', fontWeight: 700, fontSize: 14 }} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="courses" fill="#10b981" radius={[8, 8, 0, 0]} name="Total Courses" />
                    <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Curriculum & Semester Tabs Content */}
        {(activeTab === 'curriculum' || activeTab === 'semester') && currentData && (
          <>
            {/* Student Info Card */}
            {currentData?.studentInfo && Object.keys(currentData.studentInfo).length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaGraduationCap className="text-blue-600" />
                  Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(currentData.studentInfo).map(([key, value]) => (
                    <div key={key} className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">{key}</p>
                      <p className="text-sm text-gray-900 font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semesters */}
            <div className="space-y-6">
              {currentData?.semesters?.map((semester, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                  {/* Semester Header with Gradient */}
                  <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <FaStar className="w-5 h-5" />
                      </div>
                      {semester.title}
                    </h3>
                    {semester.gpa && (
                      <div className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl shadow-lg">
                        <span className="text-sm text-blue-100 font-medium mr-2">GPA:</span>
                        <span className="text-2xl font-bold text-white">{semester.gpa}</span>
                      </div>
                    )}
                  </div>

                  {/* Courses Table with Enhanced Design */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-linear-to-r from-gray-50 to-blue-50 border-b-2 border-blue-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Course Code
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Course Title
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Credit
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Grade
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Grade Point
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {semester.courses.map((course, courseIndex) => (
                          <tr key={courseIndex} className="hover:bg-linear-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-bold">
                                {course.courseCode}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-800 font-medium">{course.courseTitle}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-gray-700">{course.credit || '-'}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-black shadow-lg ${getGradeBgColor(course.grade)} ${getGradeColor(course.grade)}`}>
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
                      <tfoot className="bg-linear-to-r from-green-50 to-emerald-50 border-t-2 border-green-200">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-left">
                            <span className="text-sm font-bold text-green-800">Semester Total</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-green-800">
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
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-green-800">
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
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-green-800">
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

        {/* Empty State with Better Design */}
        {(activeTab === 'curriculum' || activeTab === 'semester') && (!currentData?.semesters || currentData.semesters.length === 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-gray-200">
            <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaGraduationCap className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Grade Data Available</h3>
            <p className="text-gray-600">Your academic records will appear here once available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
