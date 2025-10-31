'use client'

import React, { useState, useEffect } from 'react'
import { FiBook } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import CourseSearchClient from './CourseSearchClient'
import SelectedCoursesDisplay from './SelectedCoursesDisplay'
import Swal from 'sweetalert2'

interface CourseSelectionContainerProps {
  courseNames: string[]
  selectedCourses?: string[]
  onCourseSelect?: (courseName: string) => void
}

const CourseSelectionContainer: React.FC<CourseSelectionContainerProps> = ({ 
  courseNames,
  selectedCourses: externalSelectedCourses,
  onCourseSelect: externalOnCourseSelect
}) => {
  const router = useRouter()
  const [internalSelectedCourses, setInternalSelectedCourses] = useState<string[]>([])
  const [cachedCourseNames, setCachedCourseNames] = useState<string[]>(courseNames)

  // Use external selected courses if provided, otherwise use internal state
  const selectedCourses = externalSelectedCourses !== undefined ? externalSelectedCourses : internalSelectedCourses

  // Load selected courses and cached course names from localStorage on mount
  useEffect(() => {
    // Only load from localStorage if not using external state
    if (externalSelectedCourses === undefined) {
      const storedCourses = localStorage.getItem('selectedCourses')
      if (storedCourses) {
        try {
          const parsedCourses = JSON.parse(storedCourses)
          if (Array.isArray(parsedCourses)) {
            setInternalSelectedCourses(parsedCourses)
          }
        } catch (error) {
          console.error('Error parsing stored courses:', error)
          localStorage.removeItem('selectedCourses')
        }
      }
    }

    // Load cached course names
    const cached = localStorage.getItem('courseNames')
    const cacheTimestamp = localStorage.getItem('courseNamesTimestamp')

    if (cached && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      // Cache for 1 hour (3600000 ms)
      if (age < 3600000) {
        try {
          const parsedCache = JSON.parse(cached)
          if (Array.isArray(parsedCache) && parsedCache.length > 0) {
            setCachedCourseNames(parsedCache)
          }
        } catch (error) {
          console.error('Error parsing cached course names:', error)
        }
      }
    }

    // Cache the fresh course names if they're not already cached
    if (courseNames.length > 0) {
      try {
        localStorage.setItem('courseNames', JSON.stringify(courseNames))
        localStorage.setItem('courseNamesTimestamp', Date.now().toString())
      } catch (error) {
        console.error('Error storing course names in cache:', error)
      }
    }
  }, [courseNames])

  // Save to localStorage whenever selectedCourses changes (only for internal state)
  useEffect(() => {
    if (externalSelectedCourses === undefined) {
      localStorage.setItem('selectedCourses', JSON.stringify(internalSelectedCourses))
    }
  }, [internalSelectedCourses, externalSelectedCourses])

  const toggleCourseSelection = (courseName: string) => {
    if (externalOnCourseSelect) {
      // Use external handler if provided
      externalOnCourseSelect(courseName)
    } else {
      // Use internal state
      setInternalSelectedCourses(prev =>
        prev.includes(courseName)
          ? prev.filter(c => c !== courseName)
          : [...prev, courseName]
      )
    }
  }

  const removeCourse = (courseName: string) => {
    if (externalOnCourseSelect) {
      // Use external handler if provided (it will toggle/remove)
      externalOnCourseSelect(courseName)
    } else {
      setInternalSelectedCourses(prev => prev.filter(c => c !== courseName))
    }
  }

  const handleSeeAllSections = () => {
    if (selectedCourses.length === 0) {
      Swal.fire({
        title: 'No Courses Selected',
        text: 'Please select at least one course to view sections.',
        icon: 'warning',
        background: '#ffffff',
        color: '#1f2937',
        confirmButtonColor: '#3b82f6',
      })
    } else {
      router.push('/courses/routine')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 shadow-sm">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-gray-800">
        <FiBook className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-sm sm:text-base">Select Courses</span>
      </h2>

      {/* Search and Dropdown */}
      <div className="mb-4 sm:mb-6">
        <CourseSearchClient
          courseNames={cachedCourseNames}
          selectedCourses={selectedCourses}
          onToggleCourse={toggleCourseSelection}
        />
      </div>

      {/* Selected Courses Cards */}
      <SelectedCoursesDisplay
        selectedCourses={selectedCourses}
        onRemoveCourse={removeCourse}
      />

      {/* Action Button */}
      {selectedCourses.length > 0 && (
        <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-6">
          <button
            onClick={handleSeeAllSections}
            className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <FiBook className="h-5 w-5" />
            <span>See All Sections ({selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''})</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default CourseSelectionContainer
