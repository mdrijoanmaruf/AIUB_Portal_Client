import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import CourseSelectionContainer from '@/components/course-schedule/CourseSelectionContainer'
import Navbar from '@/components/Navbar/Navbar'

// Fetch course names on the server
async function getCourseNames(): Promise<string[]> {
  try {
    // Fetch all courses from MongoDB API
    const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses', {
      cache: 'force-cache', // Use Next.js caching
      next: { revalidate: 1800 } // Revalidate every 30 minutes
    })

    if (!response.ok) {
      throw new Error('Failed to fetch courses')
    }

    const result = await response.json()
    
    if (result.success && Array.isArray(result.data)) {
      // Extract unique course names
      const courseNames: string[] = result.data
        .map((course: any) => course['Course Title'])
        .filter((name: any): name is string => typeof name === 'string')
      const uniqueNames: string[] = [...new Set(courseNames)]
      return uniqueNames.sort()
    }
    
    return []
  } catch (error) {
    console.error('Error fetching course names:', error)
    return []
  }
}

const Courses = async () => {
  const courseNames = await getCourseNames()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <Navbar/>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight">
              AIUB Course Schedule Planner
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">Select courses to view their schedules</p>
          </div>
        </div>

        {/* Course Selection Section */}
        {courseNames.length > 0 ? (
          <CourseSelectionContainer courseNames={courseNames} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 lg:p-12 text-center shadow-sm">
            <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">Unable to load course names. The server may be unavailable.</p>
            <p className="text-gray-500 text-xs sm:text-sm">Please check your connection and try again.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses