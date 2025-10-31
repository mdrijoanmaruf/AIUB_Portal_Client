import React from 'react'
import { FiBook, FiClock, FiZap } from 'react-icons/fi'

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

interface SelectedCourseAndFilterProps {
  selectedCourses: string[]
  allSections: CourseSection[]
  isLoadingSections: boolean
  startTime: string
  setStartTime: (time: string) => void
  endTime: string
  setEndTime: (time: string) => void
  selectedDays: string[]
  toggleDay: (day: string) => void
  selectedStatuses: string[]
  toggleStatus: (status: string) => void
  getAvailableStatuses: () => string[]
  minSeats: string
  setMinSeats: (seats: string) => void
  maxGap: string
  setMaxGap: (gap: string) => void
  generateRoutines: () => void
  isGenerating: boolean
  TIME_OPTIONS: { label: string; value: string }[]
  DAYS: string[]
  MIN_SEAT_OPTIONS: { label: string; value: string }[]
  MAX_GAP_OPTIONS: { label: string; value: string }[]
}

const SelectedCourseAndFilter: React.FC<SelectedCourseAndFilterProps> = ({
  selectedCourses,
  allSections,
  isLoadingSections,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  selectedDays,
  toggleDay,
  selectedStatuses,
  toggleStatus,
  getAvailableStatuses,
  minSeats,
  setMinSeats,
  maxGap,
  setMaxGap,
  generateRoutines,
  isGenerating,
  TIME_OPTIONS,
  DAYS,
  MIN_SEAT_OPTIONS,
  MAX_GAP_OPTIONS
}) => {
  return (
    <>
      {/* Selected Courses Display */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
          <FiBook className="text-blue-600 h-5 w-5" />
          Selected Courses ({selectedCourses.length})
        </h2>

        {isLoadingSections ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading course sections...</p>
          </div>
        ) : selectedCourses.length > 0 ? (
          <div className="space-y-3">
            {selectedCourses.map((course, index) => {
              // Get section count for this course
              const normalizeName = (name: string) =>
                name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

              const courseSections = allSections.filter(section => {
                const normalizedCourseTitle = normalizeName(section['Course Title'])
                const normalizedCourseName = normalizeName(course)
                return normalizedCourseTitle === normalizedCourseName ||
                       normalizedCourseTitle.includes(normalizedCourseName) ||
                       normalizedCourseName.includes(normalizedCourseTitle)
              })

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FiBook className="text-blue-600 h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium text-gray-900">{course}</span>
                  </div>
                  <span className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
                    {courseSections.length} sections available
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">No courses selected</p>
            <p className="text-gray-500 text-xs mt-1">Please select courses first</p>
          </div>
        )}
      </div>

      {/* Filter Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
          <FiClock className="text-purple-600 h-5 w-5" />
          Preferences & Filters
        </h2>

        <div className="space-y-6">
          {/* Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class End Time
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {DAYS.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          {getAvailableStatuses().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Section Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {getAvailableStatuses().map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
              {selectedStatuses.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  No status filter selected - all statuses will be included
                </p>
              )}
            </div>
          )}

          {/* Minimum Seats Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Available Seats
            </label>
            <select
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              {MIN_SEAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only show sections with at least this many available seats
            </p>
          </div>

          {/* Maximum Gap Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Gap Between Classes
            </label>
            <select
              value={maxGap}
              onChange={(e) => setMaxGap(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              {MAX_GAP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Maximum time gap allowed between consecutive classes on the same day
            </p>
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={generateRoutines}
              disabled={selectedCourses.length === 0 || selectedDays.length === 0 || isGenerating}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FiZap className="h-5 w-5" />
              <span>{isGenerating ? 'Generating...' : 'Generate All Possible Routines'}</span>
            </button>
            {selectedCourses.length === 0 && (
              <p className="text-gray-500 text-xs mt-2 text-center">
                Select courses first to enable generation
              </p>
            )}
            {selectedDays.length === 0 && selectedCourses.length > 0 && (
              <p className="text-gray-500 text-xs mt-2 text-center">
                Select at least one day
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SelectedCourseAndFilter