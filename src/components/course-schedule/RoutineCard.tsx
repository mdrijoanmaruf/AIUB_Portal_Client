'use client'

import React, { useState } from 'react'
import { FiBook, FiClock, FiUsers, FiX, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi'

interface CourseSection {
  _id: string
  'Class ID': string
  'Course Title': string
  Section: string
  Status: string
  Capacity: string
  Count: string
  Time: {
    'Class Type': string
    Day: string
    'Start Time': string
    'End Time': string
    'Class Name': string
  }[]
  createdAt: string
  updatedAt: string
}

interface RoutineCardProps {
  section: CourseSection
  alternativeSections?: string[]
  onRemove: (sectionId: string) => void
}

const RoutineCard: React.FC<RoutineCardProps> = ({ section, alternativeSections = [], onRemove }) => {
  const [showAlternatives, setShowAlternatives] = useState(false)

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
            <h3 className="text-base sm:text-xl font-bold text-gray-800 truncate">
              {section['Course Title']}
            </h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold border border-blue-200">
              Section {section.Section}
            </span>
          </div>
          
          {/* Course Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
              <FiUsers className="h-3.5 w-3.5 text-gray-500" />
              <span>Capacity: {section.Count}/{section.Capacity}</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Class ID:</span>
              <span className="text-xs font-medium text-gray-700">{section['Class ID']}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                section.Status === 'Open' 
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : section.Status === 'Closed'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
              }`}>
                {section.Status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(section._id)}
          className="p-1.5 sm:p-2 hover:bg-red-50 border border-red-200 text-red-600 rounded-lg transition-colors group "
          title="Remove from routine"
        >
          <FiX className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>

      {/* Schedule Details */}
      <div className="space-y-1.5 sm:space-y-2">
        {section.Time.map((timeSlot, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium text-xs border border-blue-200">
              {timeSlot['Class Type']}
            </span>
            <div className="flex items-center gap-1.5 text-gray-700">
              <FiCalendar className="h-3.5 w-3.5 text-gray-500" />
              <span className="font-medium text-sm">{timeSlot.Day}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <FiClock className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-sm">{timeSlot['Start Time']} - {timeSlot['End Time']}</span>
            </div>
            <span className="text-xs text-gray-600">{timeSlot['Class Name']}</span>
          </div>
        ))}
      </div>

      {/* Alternative Sections */}
      {alternativeSections.length > 0 && (
        <div className="mt-4 border-t border-blue-200 pt-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-gray-700">
              Alternative Sections ({alternativeSections.length})
            </span>
            {showAlternatives ? (
              <FiChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <FiChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>
          
          {showAlternatives && (
            <div className="mt-3 flex flex-wrap gap-2">
              {alternativeSections.map((altSection, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Section {altSection}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RoutineCard
