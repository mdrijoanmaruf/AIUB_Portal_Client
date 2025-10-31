import React from 'react'
import { FiZap } from 'react-icons/fi'

const AutoCourseHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4">
        <FiZap className="h-8 w-8 text-purple-600" />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          Auto Routine Generator
        </h1>
      </div>
      <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
        Generate and view ALL possible complete routines (up to 50) that include ALL your selected courses with no conflicts.
      </p>
    </div>
  )
}

export default AutoCourseHeader