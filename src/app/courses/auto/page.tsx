'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FiArrowLeft, FiBook, FiZap, FiClock, FiCalendar, FiDownload } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { toPng } from 'html-to-image'

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

interface Routine {
  sections: CourseSection[]
  conflicts: number
}

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

// Generate time options from 8:00 AM to 7:00 PM with 1-hour intervals
const generateTimeOptions = () => {
  const options = []
  const startHour = 8 // 8:00 AM
  const endHour = 19 // 7:00 PM (19:00 in 24-hour)
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const timeLabel = `${hour12}:00 ${ampm}`
    const timeValue = `${hour.toString().padStart(2, '0')}:00`
    
    options.push({ label: timeLabel, value: timeValue })
  }
  
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const MIN_SEAT_OPTIONS = [
  { label: 'No minimum', value: '' },
  { label: '5 seats', value: '5' },
  { label: '10 seats', value: '10' },
  { label: '15 seats', value: '15' },
  { label: '20 seats', value: '20' },
  { label: '25 seats', value: '25' },
  { label: '30+ seats', value: '30+' }
]

const MAX_GAP_OPTIONS = [
  { label: 'No limit', value: '' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '2.5 hours', value: '150' },
  { label: '3 hours', value: '180' }
]

const AutoRoutineGenerate = () => {
  const router = useRouter()
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [startTime, setStartTime] = useState<string>('08:00')
  const [endTime, setEndTime] = useState<string>('19:00')
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [minSeats, setMinSeats] = useState<string>('')
  const [maxGap, setMaxGap] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRoutines, setGeneratedRoutines] = useState<Routine[]>([])
  const [allSections, setAllSections] = useState<CourseSection[]>([])
  const [isLoadingSections, setIsLoadingSections] = useState(true)
  const routineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Load selected courses from localStorage
    const storedCourses = localStorage.getItem('selectedCourses')
    if (storedCourses) {
      try {
        const parsedCourses = JSON.parse(storedCourses)
        if (Array.isArray(parsedCourses)) {
          setSelectedCourses(parsedCourses)
        }
      } catch (error) {
        console.error('Error parsing selected courses:', error)
      }
    }

    // Load all course sections from localStorage
    const storedSections = localStorage.getItem('autoGenerateCourseSections')
    if (storedSections) {
      try {
        const parsedSections = JSON.parse(storedSections)
        if (Array.isArray(parsedSections)) {
          setAllSections(parsedSections)
          setIsLoadingSections(false)
          return
        }
      } catch (error) {
        console.error('Error parsing stored sections:', error)
      }
    }

    // Fallback: fetch from API if not in localStorage
    fetchCourseSections()
  }, [])

  const fetchCourseSections = async () => {
    try {
      setIsLoadingSections(true)
      const cachedData = localStorage.getItem('allCourseSections')
      let allCoursesData: CourseSection[] = []

      if (cachedData) {
        allCoursesData = JSON.parse(cachedData)
      } else {
        const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses')
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          allCoursesData = result.data
        }
      }

      // Normalize and filter sections
      const normalizeName = (name: string) => 
        name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

      const storedCourses = localStorage.getItem('selectedCourses')
      if (storedCourses) {
        const courseNames = JSON.parse(storedCourses)
        
        const filteredSections = allCoursesData.filter((course: CourseSection) => {
          const normalizedCourseTitle = normalizeName(course['Course Title'])
          return courseNames.some((selectedName: string) => {
            const normalizedSelectedName = normalizeName(selectedName)
            return normalizedCourseTitle === normalizedSelectedName ||
                   normalizedCourseTitle.includes(normalizedSelectedName) ||
                   normalizedSelectedName.includes(normalizedCourseTitle)
          })
        })

        setAllSections(filteredSections)
      }
    } catch (error) {
      console.error('Error fetching course sections:', error)
    } finally {
      setIsLoadingSections(false)
    }
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // Get unique status values from loaded sections
  const getAvailableStatuses = (): string[] => {
    const statuses = new Set<string>()
    allSections.forEach(section => {
      if (section.Status) {
        statuses.add(section.Status)
      }
    })
    return Array.from(statuses).sort()
  }

  const timeToMinutes = (time: string): number => {
    // Handle both 24-hour format (08:00) and 12-hour format with AM/PM (08:00 AM)
    const trimmedTime = time.trim()
    
    // Check if time has AM/PM
    if (trimmedTime.includes('AM') || trimmedTime.includes('PM')) {
      const [timePart, period] = trimmedTime.split(' ')
      let [hours, minutes] = timePart.split(':').map(Number)
      
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      
      return hours * 60 + minutes
    } else {
      // 24-hour format
      const [hours, minutes] = trimmedTime.split(':').map(Number)
      return hours * 60 + minutes
    }
  }

  const hasTimeConflict = (section1: CourseSection, section2: CourseSection): boolean => {
    for (const time1 of section1.Time) {
      for (const time2 of section2.Time) {
        if (time1.Day === time2.Day) {
          const start1 = timeToMinutes(time1['Start Time'])
          const end1 = timeToMinutes(time1['End Time'])
          const start2 = timeToMinutes(time2['Start Time'])
          const end2 = timeToMinutes(time2['End Time'])

          if (!(end1 <= start2 || end2 <= start1)) {
            return true
          }
        }
      }
    }
    return false
  }

  const hasAcceptableGaps = (sections: CourseSection[]): boolean => {
    if (!maxGap) return true // No limit set

    const maxGapMinutes = parseInt(maxGap)
    
    // Collect all time slots
    const allTimeSlots: { day: string; start: number; end: number }[] = []
    
    sections.forEach(section => {
      section.Time.forEach(time => {
        allTimeSlots.push({
          day: time.Day,
          start: timeToMinutes(time['Start Time']),
          end: timeToMinutes(time['End Time'])
        })
      })
    })

    // Group by day and check gaps
    const dayGroups = allTimeSlots.reduce((groups, slot) => {
      if (!groups[slot.day]) groups[slot.day] = []
      groups[slot.day].push(slot)
      return groups
    }, {} as Record<string, typeof allTimeSlots>)

    // Check gaps for each day
    for (const day in dayGroups) {
      const daySlots = dayGroups[day].sort((a, b) => a.start - b.start)
      
      for (let i = 1; i < daySlots.length; i++) {
        const gap = daySlots[i].start - daySlots[i-1].end
        if (gap > maxGapMinutes) {
          return false
        }
      }
    }

    return true
  }

  const filterSectionByPreferences = (section: CourseSection): boolean => {
    const userStartMinutes = timeToMinutes(startTime)
    const userEndMinutes = timeToMinutes(endTime)

    // Section must have at least one time slot
    if (!section.Time || section.Time.length === 0) {
      return false
    }

    // Check status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(section.Status)) {
      return false
    }

    // Check minimum seats filter
    if (minSeats) {
      const availableSeats = parseInt(section.Capacity) - parseInt(section.Count)
      const minSeatsValue = minSeats === '30+' ? 30 : parseInt(minSeats)
      if (availableSeats < minSeatsValue) {
        return false
      }
    }

    // Check if ALL time slots of the section match the preferences
    // (because all slots are part of the same section and must be taken together)
    for (const time of section.Time) {
      // Check if day is selected
      if (!selectedDays.includes(time.Day)) {
        return false
      }

      // Check if time is within user's preference
      const sectionStart = timeToMinutes(time['Start Time'])
      const sectionEnd = timeToMinutes(time['End Time'])

      if (sectionStart < userStartMinutes || sectionEnd > userEndMinutes) {
        return false
      }
    }

    return true
  }

  const generateRoutines = () => {
    console.log('Starting routine generation...')
    console.log('All sections:', allSections.length)
    console.log('Selected courses:', selectedCourses)
    console.log('Time range:', startTime, '-', endTime)
    console.log('Selected days:', selectedDays)
    
    setIsGenerating(true)
    setGeneratedRoutines([])

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        // Group sections by course
        const normalizeName = (name: string) => 
          name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

        const sectionsByCourse = new Map<string, CourseSection[]>()
        
        allSections.forEach(section => {
          const courseName = normalizeName(section['Course Title'])
          const filtered = filterSectionByPreferences(section)
          
          if (filtered) {
            if (!sectionsByCourse.has(courseName)) {
              sectionsByCourse.set(courseName, [])
            }
            sectionsByCourse.get(courseName)?.push(section)
          }
        })

        console.log('Sections by course after filtering:', Object.fromEntries(sectionsByCourse))
        console.log('Number of courses with available sections:', sectionsByCourse.size)

        // Generate all possible combinations
        const courseNames = Array.from(sectionsByCourse.keys())
        const combinations: CourseSection[][] = []

        const generateCombinations = (index: number, current: CourseSection[]) => {
          if (index === courseNames.length) {
            combinations.push([...current])
            return
          }

          const courseSections = sectionsByCourse.get(courseNames[index]) || []
          
          // If no sections available for this course, try to continue with partial routine
          if (courseSections.length === 0) {
            generateCombinations(index + 1, current)
            return
          }
          
          for (const section of courseSections) {
            // Check for conflicts with current routine
            let hasConflict = false
            for (const existingSection of current) {
              if (hasTimeConflict(section, existingSection)) {
                hasConflict = true
                break
              }
            }

            if (!hasConflict) {
              current.push(section)
              // Check if the current combination has acceptable gaps
              if (hasAcceptableGaps(current)) {
                generateCombinations(index + 1, current)
              }
              current.pop()
            }
          }
          
          // Also try without adding any section for this course (for partial routines)
          generateCombinations(index + 1, current)
        }

        generateCombinations(0, [])

        console.log('Total combinations generated:', combinations.length)

        // Convert to Routine format and sort by number of courses (prefer complete routines)
        const routines: Routine[] = combinations
          .filter(sections => sections.length > 0) // Only include non-empty routines
          .map(sections => ({
            sections,
            conflicts: 0
          }))
          .sort((a, b) => b.sections.length - a.sections.length)
          .slice(0, 20) // Show top 20 routines

        console.log('Final routines:', routines.length)
        setGeneratedRoutines(routines)
      } catch (error) {
        console.error('Error generating routines:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 100)
  }

  const saveRoutine = (routine: Routine) => {
    localStorage.setItem('myRoutineSections', JSON.stringify(routine.sections))
    router.push('/courses/my-routine')
  }

  // Group sections by day and time for display
  const groupSectionsByDayTime = (sections: CourseSection[]) => {
    const grouped: Record<string, Record<string, CourseSection[]>> = {}
    
    sections.forEach(section => {
      section.Time.forEach(time => {
        const day = time.Day
        const timeSlot = `${time['Start Time']} - ${time['End Time']}`
        
        if (!grouped[day]) {
          grouped[day] = {}
        }
        if (!grouped[day][timeSlot]) {
          grouped[day][timeSlot] = []
        }
        
        // Check if this section is already added for this time slot
        const alreadyAdded = grouped[day][timeSlot].some(s => s._id === section._id)
        if (!alreadyAdded) {
          grouped[day][timeSlot].push(section)
        }
      })
    })
    
    return grouped
  }

  // Download routine as image
  const downloadRoutineImage = async (index: number) => {
    const element = routineRefs.current[index]
    if (!element) return

    try {
      const dataUrl = await toPng(element, {
        quality: 1.0,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `routine-option-${index + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error downloading routine:', error)
    }
  }

  // Generate time slots for the timetable grid (every 30 minutes)
  const generateTimeSlots = () => {
    const slots: string[] = []
    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)
    
    for (let minutes = start; minutes <= end; minutes += 30) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      const ampm = hours >= 12 ? 'PM' : 'AM'
      slots.push(`${hour12}:${mins.toString().padStart(2, '0')} ${ampm}`)
    }
    
    return slots
  }

  // Convert routine to chart data for Recharts
  const convertRoutineToChartData = (routine: Routine, courseColors: Map<string, string>) => {
    const chartData: any[] = []
    const daysOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    
    daysOrder.forEach(day => {
      const daySections = routine.sections.filter(section =>
        section.Time.some(t => t.Day === day)
      )
      
      if (daySections.length > 0) {
        daySections.forEach(section => {
          section.Time.forEach(time => {
            if (time.Day === day) {
              const startMinutes = timeToMinutes(time['Start Time'])
              const endMinutes = timeToMinutes(time['End Time'])
              const duration = endMinutes - startMinutes
              
              chartData.push({
                day,
                course: section['Course Title'],
                section: section.Section,
                start: startMinutes,
                duration,
                startTime: time['Start Time'],
                endTime: time['End Time'],
                classType: time['Class Type'],
                className: time['Class Name'],
                status: section.Status,
                capacity: section.Capacity,
                count: section.Count,
                color: courseColors.get(section['Course Title']) || 'bg-gray-100'
              })
            }
          })
        })
      }
    })
    
    return chartData
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.course}</p>
          <p className="text-sm text-gray-600">Section {data.section}</p>
          <p className="text-sm text-gray-600">{data.startTime} - {data.endTime}</p>
          <p className="text-sm text-gray-600">{data.classType} • {data.className}</p>
          <p className="text-sm text-gray-600">{data.status} • {data.count}/{data.capacity} seats</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Image
                  src="/aiub.svg"
                  alt="AIUB Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden md:block">
                <h2 className="text-lg font-bold text-blue-600">AIUB Portal</h2>
              </div>
            </div>

            {/* Right - Back Button */}
            <button
              onClick={() => router.push('/courses/routine')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 rounded-lg shadow-sm"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline text-sm">Back to Sections</span>
              <span className="sm:hidden text-sm">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FiZap className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              Auto Routine Generator
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Automatically generate an optimized routine based on your selected courses and preferences.
          </p>
        </div>

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
                <span>{isGenerating ? 'Generating...' : 'Generate Routines'}</span>
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

        {/* Generated Routines */}
        {isGenerating && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Generating Routines...
            </h3>
            <p className="text-gray-600 text-sm">
              Please wait while we find the best schedules for you
            </p>
          </div>
        )}

        {!isGenerating && generatedRoutines.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <FiCalendar className="text-green-600 h-5 w-5" />
              Generated Routines ({generatedRoutines.length})
            </h2>

            <div className="space-y-6">
              {generatedRoutines.map((routine, idx) => {
                const daysOrder = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
                
                // Get all days that have classes in this routine
                const activeDays = daysOrder.filter(day => 
                  routine.sections.some(section => 
                    section.Time.some(t => t.Day === day)
                  )
                )
                
                // Color palette for different courses
                const colors = [
                  'bg-blue-100 border-blue-300 text-blue-900',
                  'bg-purple-100 border-purple-300 text-purple-900',
                  'bg-green-100 border-green-300 text-green-900',
                  'bg-orange-100 border-orange-300 text-orange-900',
                  'bg-pink-100 border-pink-300 text-pink-900',
                  'bg-cyan-100 border-cyan-300 text-cyan-900',
                  'bg-indigo-100 border-indigo-300 text-indigo-900',
                  'bg-teal-100 border-teal-300 text-teal-900',
                ]
                
                // Assign colors to courses
                const courseColors = new Map<string, string>()
                routine.sections.forEach((section, i) => {
                  if (!courseColors.has(section['Course Title'])) {
                    courseColors.set(section['Course Title'], colors[i % colors.length])
                  }
                })
                
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          Routine Option {idx + 1}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {routine.sections.length} / {selectedCourses.length} courses
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => downloadRoutineImage(idx)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          <FiDownload className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          onClick={() => saveRoutine(routine)}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Use This Routine
                        </button>
                      </div>
                    </div>

                    {/* Timetable Chart */}
                    <div 
                      ref={el => { routineRefs.current[idx] = el }}
                      className="p-6 bg-white"
                    >
                      <div className="mb-4">
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Weekly Schedule</h4>
                        <p className="text-sm text-gray-600">Routine Option {idx + 1}</p>
                      </div>
                      
                      <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={convertRoutineToChartData(routine, courseColors)}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                            barCategoryGap="10%"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="day" 
                              type="category"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              type="number"
                              domain={[timeToMinutes(startTime), timeToMinutes(endTime)]}
                              tickFormatter={(value) => {
                                const hours = Math.floor(value / 60)
                                const mins = value % 60
                                const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
                                const ampm = hours >= 12 ? 'PM' : 'AM'
                                return `${hour12}:${mins.toString().padStart(2, '0')} ${ampm}`
                              }}
                              tick={{ fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="duration" fill="#8884d8">
                              {convertRoutineToChartData(routine, courseColors).map((entry, index) => {
                                const colorMap: { [key: string]: string } = {
                                  'bg-blue-100 border-blue-300 text-blue-900': '#3B82F6',
                                  'bg-purple-100 border-purple-300 text-purple-900': '#8B5CF6',
                                  'bg-green-100 border-green-300 text-green-900': '#10B981',
                                  'bg-orange-100 border-orange-300 text-orange-900': '#F97316',
                                  'bg-pink-100 border-pink-300 text-pink-900': '#EC4899',
                                  'bg-cyan-100 border-cyan-300 text-cyan-900': '#06B6D4',
                                  'bg-indigo-100 border-indigo-300 text-indigo-900': '#6366F1',
                                  'bg-teal-100 border-teal-300 text-teal-900': '#14B8A6',
                                }
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={colorMap[entry.color] || '#6B7280'} 
                                  />
                                )
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Course Legend */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Course Legend</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {Array.from(courseColors.entries()).map(([courseTitle, colorClass]) => {
                            const section = routine.sections.find(s => s['Course Title'] === courseTitle)
                            return (
                              <div key={courseTitle} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${colorClass} border-2`}></div>
                                <div className="text-xs">
                                  <div className="font-medium text-gray-900">{courseTitle}</div>
                                  {section && (
                                    <div className="text-gray-600">
                                      Section {section.Section} • {section.Status} • {section.Count}/{section.Capacity}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {routine.sections.length < selectedCourses.length && (
                      <div className="mx-6 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          ⚠️ This routine doesn't include all selected courses. Some courses may not have available sections that fit your preferences.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Routines Found */}
        {!isGenerating && generatedRoutines.length === 0 && allSections.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <FiCalendar className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Routines Found
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              We couldn't generate any routines with your current preferences. This might be because:
            </p>
            <ul className="text-left max-w-md mx-auto text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>The time range is too narrow - try expanding your start/end times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Too few days selected - try selecting more days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>The gap limit is too restrictive - try increasing the maximum gap between classes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Limited section availability - some courses may not have sections matching your preferences</span>
              </li>
            </ul>
            <button
              onClick={() => {
                setStartTime('08:00')
                setEndTime('19:00')
                setSelectedDays(DAYS)
                setSelectedStatuses([])
                setMinSeats('')
                setMaxGap('')
              }}
              className="mt-6 px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Reset Filters to Default
            </button>
          </div>
        )}

        {/* Initial state - before generation */}
        {!isGenerating && generatedRoutines.length === 0 && allSections.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Ready to Generate Routines
            </h3>
            <p className="text-gray-600 text-sm">
              Set your preferences and click "Generate Routines" to see possible schedules
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AutoRoutineGenerate