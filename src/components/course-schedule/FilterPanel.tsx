'use client'

import React from 'react'
import { FiFilter, FiX } from 'react-icons/fi'

interface Filters {
  courses: string[]
  status: string[]
  classType: string[]
  time: string[]
  day: string[]
  searchTerm: string
}

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  selectedCourseNames: string[]
  availableTimeSlots: string[]
  availableDays: string[]
  activeFilterCount: number
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  selectedCourseNames,
  availableTimeSlots,
  availableDays,
  activeFilterCount,
}) => {
  const statusOptions = ['Open', 'Closed', 'Waitlist']
  const classTypeOptions = ['Theory', 'Lab']

  const toggleFilter = (filterType: keyof Filters, value: string) => {
    const currentArray = filters[filterType] as string[]
    onFiltersChange({
      ...filters,
      [filterType]: currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      courses: [],
      status: [],
      classType: [],
      time: [],
      day: [],
      searchTerm: ''
    })
  }

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-1.5 sm:gap-2 text-gray-800">
          <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
            <FiFilter className="text-blue-600 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <span>Filters</span>
        </h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-md text-xs font-medium transition-all duration-200"
          >
            <FiX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Compact Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-2 sm:mb-3">
        {/* Course Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
          <select
            value={filters.courses[0] || ''}
            onChange={(e) => {
              const selected = e.target.value ? [e.target.value] : []
              // Clear dependent filters (day and time) whenever course changes
              onFiltersChange({ ...filters, courses: selected, day: [], time: [] })
            }}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Courses</option>
            {selectedCourseNames.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>
        </div>

        {/* Day Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
          <select
            value={filters.day[0] || ''}
            onChange={(e) => onFiltersChange({ ...filters, day: e.target.value ? [e.target.value] : [] })}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Days</option>
            {availableDays.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        {/* Time Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Time Slot</label>
          <select
            value={filters.time[0] || ''}
            onChange={(e) => onFiltersChange({ ...filters, time: e.target.value ? [e.target.value] : [] })}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Times</option>
            {availableTimeSlots.map(timeSlot => (
              <option key={timeSlot} value={timeSlot}>{timeSlot}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Section..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Compact Toggle Filters */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs text-gray-600 font-medium">Quick:</span>
        {statusOptions.map(status => (
          <button
            key={status}
            onClick={() => toggleFilter('status', status)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              filters.status.includes(status)
                ? status === 'Open'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : status === 'Closed'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
        <div className="w-px h-3 sm:h-4 bg-gray-300"></div>
        {classTypeOptions.map(type => (
          <button
            key={type}
            onClick={() => toggleFilter('classType', type)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              filters.classType.includes(type)
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {filters.courses.map(course => (
              <span key={course} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                Course: {course.substring(0, 20)}
                <button onClick={() => toggleFilter('courses', course)} className="hover:text-blue-900">
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.day.map(day => (
              <span key={day} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                Day: {day}
                <button onClick={() => toggleFilter('day', day)} className="hover:text-green-900">
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
            {filters.time.map(timeSlot => (
              <span key={timeSlot} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                Time: {timeSlot}
                <button onClick={() => toggleFilter('time', timeSlot)} className="hover:text-purple-900">
                  <FiX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
