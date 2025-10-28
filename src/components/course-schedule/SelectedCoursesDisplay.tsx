'use client'

import React from 'react'
import { FiBook, FiX } from 'react-icons/fi'

interface SelectedCoursesDisplayProps {
  selectedCourses: string[]
  onRemoveCourse: (courseName: string) => void
}

const SelectedCoursesDisplay: React.FC<SelectedCoursesDisplayProps> = ({
  selectedCourses,
  onRemoveCourse,
}) => {
  if (selectedCourses.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
        <FiBook className="h-4 w-4" />
        Selected Courses ({selectedCourses.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {selectedCourses.map((course) => (
          <div
            key={course}
            className="group p-3 sm:p-4 lg:p-5 relative overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-bl from-blue-100/50 to-transparent rounded-full -translate-y-4 sm:-translate-y-6 translate-x-4 sm:translate-x-6"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-16 sm:h-16 bg-linear-to-tr from-purple-100/50 to-transparent rounded-full translate-y-3 sm:translate-y-4 -translate-x-3 sm:-translate-x-4"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
                      <FiBook className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Course</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-800 leading-tight line-clamp-2">
                    {course}
                  </h4>
                </div>
                <button
                  onClick={() => onRemoveCourse(course)}
                  className="shrink-0 p-1.5 sm:p-2 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 transition-all duration-200 group-hover:scale-110"
                  title="Remove course"
                >
                  <FiX className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>

              {/* Course code hint */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-xs">Ready for scheduling</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SelectedCoursesDisplay
