'use client'

import React, { useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

interface CourseSearchClientProps {
  courseNames: string[]
  selectedCourses: string[]
  onToggleCourse: (courseName: string) => void
}

const CourseSearchClient: React.FC<CourseSearchClientProps> = ({
  courseNames,
  selectedCourses,
  onToggleCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredCourses = courseNames.filter(course =>
    course.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (courseName: string) => {
    onToggleCourse(courseName)
    setSearchTerm('')
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base shadow-sm"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setShowDropdown(false)
              setSearchTerm('')
            }}
          />
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 sm:max-h-80 overflow-y-auto">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <button
                  key={course}
                  onClick={() => handleToggle(course)}
                  className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedCourses.includes(course) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base truncate pr-2">{course}</span>
                    {selectedCourses.includes(course) && (
                      <span className="text-blue-600 text-xs  font-medium">✓ Selected</span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 sm:p-4 text-center text-gray-500 text-sm">No courses found</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CourseSearchClient
