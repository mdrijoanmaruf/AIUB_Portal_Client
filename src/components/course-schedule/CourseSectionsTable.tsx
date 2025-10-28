'use client'

import React from 'react'
import { FiBook, FiClock, FiUsers, FiCheckCircle, FiXCircle } from 'react-icons/fi'

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

interface CourseSectionsTableProps {
  courseTitle: string
  sections: CourseSection[]
  selectedSections: CourseSection[]
  onSelectSection: (section: CourseSection) => void
  checkTimeClash: (section: CourseSection) => { hasClash: boolean; clashingCourse?: string; clashDetails?: string }
}

const CourseSectionsTable: React.FC<CourseSectionsTableProps> = ({
  courseTitle,
  sections,
  selectedSections,
  onSelectSection,
  checkTimeClash,
}) => {
  const isSectionSelected = (section: CourseSection) => {
    return selectedSections.some(s => s._id === section._id)
  }

  const isCourseSelected = (courseTitle: string) => {
    return selectedSections.some(s => s['Course Title'] === courseTitle)
  }

  const hasTimeClash = (section: CourseSection): boolean => {
    if (isSectionSelected(section)) return false
    const clashCheck = checkTimeClash(section)
    return clashCheck.hasClash
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
      <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-gray-800">
          <FiBook className="text-blue-600 h-4 w-4 sm:h-5 sm:w-5" />
          <span className="truncate">{courseTitle}</span>
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm mt-1">
          {sections.length} section{sections.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Section</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Capacity</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule</th>
              <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sections.map(section => {
              const isSelected = isSectionSelected(section)
              const courseHasSelection = isCourseSelected(section['Course Title'])
              const isDisabled = courseHasSelection && !isSelected
              const hasClash = hasTimeClash(section)

              return (
                <tr key={section._id} className={`hover:bg-gray-50 transition-colors ${hasClash && !isDisabled ? 'bg-red-50' : ''}`}>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3">
                    <span className="font-medium text-gray-900 text-sm sm:text-base">{section.Section}</span>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      section.Status === 'Open' 
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : section.Status === 'Closed'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {section.Status}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <FiUsers className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-sm">{section.Count}/{section.Capacity}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3">
                    <div className="space-y-1.5">
                      {section.Time.map((slot, idx) => {
                        // Get all days for this time slot (group by time)
                        const sameTimeSlots = section.Time.filter(t => 
                          t['Start Time'] === slot['Start Time'] && 
                          t['End Time'] === slot['End Time'] &&
                          t['Class Type'] === slot['Class Type']
                        )
                        const days = sameTimeSlots.map(t => t.Day).join(', ')
                        
                        // Only render once per unique time slot
                        const isFirstOfGroup = section.Time.findIndex(t => 
                          t['Start Time'] === slot['Start Time'] && 
                          t['End Time'] === slot['End Time'] &&
                          t['Class Type'] === slot['Class Type']
                        ) === idx
                        
                        if (!isFirstOfGroup) return null
                        
                        return (
                          <div key={idx} className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium border border-blue-200">
                              {slot['Class Type']}
                            </span>
                            <span className="font-medium text-gray-700">{days}</span>
                            <div className="flex items-center gap-1">
                              <FiClock className="h-3 w-3 text-gray-400" />
                              <span>{slot['Start Time']} - {slot['End Time']}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 lg:px-4 py-2.5 sm:py-3">
                    <div className="flex justify-center">
                      <button
                        onClick={() => !isDisabled && !hasClash && onSelectSection(section)}
                        disabled={isDisabled || hasClash}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                            : isDisabled
                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                            : hasClash
                            ? 'bg-red-100 text-red-600 border border-red-300 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <FiCheckCircle className="h-3.5 w-3.5" />
                            <span>Selected</span>
                          </>
                        ) : hasClash ? (
                          <>
                            <FiXCircle className="h-3.5 w-3.5" />
                            <span>Clash</span>
                          </>
                        ) : (
                          <span>{isDisabled ? 'Disabled' : 'Select'}</span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CourseSectionsTable
