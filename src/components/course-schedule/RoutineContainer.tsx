'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { FiBook, FiCalendar, FiDownload, FiClock, FiArrowLeft } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import FilterPanel from './FilterPanel'
import CourseSectionsTable from './CourseSectionsTable'
import Swal from 'sweetalert2'
import RoutineSkeleton from '../skeletons/RoutineSkeleton'

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

interface Filters {
  courses: string[]
  status: string[]
  classType: string[]
  time: string[]
  day: string[]
  searchTerm: string
  minSeats: string
}

const RoutineContainer: React.FC = () => {
  const router = useRouter()
  const [courseSections, setCourseSections] = useState<CourseSection[]>([])
  const [filteredSections, setFilteredSections] = useState<CourseSection[]>([])
  const [selectedCourseNames, setSelectedCourseNames] = useState<string[]>([])
  const [selectedSections, setSelectedSections] = useState<CourseSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    courses: [],
    status: [],
    classType: [],
    time: [],
    day: [],
    searchTerm: '',
    minSeats: ''
  })

  // Load course data from localStorage and fetch sections
  useEffect(() => {
    const storedCourses = localStorage.getItem('selectedCourses')
    if (storedCourses) {
      try {
        const parsedCourses = JSON.parse(storedCourses)
        if (Array.isArray(parsedCourses) && parsedCourses.length > 0) {
          setSelectedCourseNames(parsedCourses)
          fetchAllSections(parsedCourses)
        } else {
          Swal.fire({
            title: 'No Courses Selected',
            text: 'Please select courses first.',
            icon: 'warning',
            background: '#ffffff',
            color: '#1f2937',
            confirmButtonColor: '#3b82f6',
          }).then(() => router.push('/courses'))
        }
      } catch (error) {
        console.error('Error parsing stored courses:', error)
        router.push('/courses')
      }
    } else {
      router.push('/courses')
    }

    // Load selected sections from localStorage
    const storedSections = localStorage.getItem('myRoutineSections')
    if (storedSections) {
      try {
        const parsed = JSON.parse(storedSections)
        if (Array.isArray(parsed)) {
          setSelectedSections(parsed)
        }
      } catch (error) {
        console.error('Error parsing stored sections:', error)
      }
    }
  }, [router])

  const clearRoutine = () => {
    Swal.fire({
      title: 'Clear Routine?',
      text: 'This will remove all selected sections from your routine. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Clear Routine',
      background: '#ffffff',
      color: '#1f2937',
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear selected sections from localStorage
        localStorage.removeItem('myRoutineSections')
        localStorage.removeItem('selectedCourses')
        
        // Reset state
        setSelectedSections([])
        setSelectedCourseNames([])
        
        // Show success message
        Swal.fire({
          title: 'Routine Cleared!',
          text: 'Your routine has been cleared successfully.',
          icon: 'success',
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#10b981',
          timer: 2000,
          timerProgressBar: true,
        }).then(() => {
          // Redirect back to courses page
          router.push('/courses')
        })
      }
    })
  }

  const fetchAllSections = async (courseNames: string[]) => {
    try {
      // Check if data is cached
      const cachedData = localStorage.getItem('allCourseSections')
      const cacheTimestamp = localStorage.getItem('allCourseSectionsTimestamp')
      
      if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp)
        // Cache for 30 minutes (1800000 ms)
        if (age < 1800000) {
          try {
            const parsedCache = JSON.parse(cachedData)
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              // Normalize course name helper
              const normalizeName = (name: string) => 
                name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

              // Filter courses by the selected course names with fuzzy matching
              const filteredSections = parsedCache.filter((course: CourseSection) => {
                const normalizedCourseTitle = normalizeName(course['Course Title'])
                return courseNames.some(selectedName => {
                  const normalizedSelectedName = normalizeName(selectedName)
                  return normalizedCourseTitle === normalizedSelectedName ||
                         normalizedCourseTitle.includes(normalizedSelectedName) ||
                         normalizedSelectedName.includes(normalizedCourseTitle)
                })
              })
              
              setCourseSections(filteredSections)
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('Error parsing cached course data:', error)
          }
        }
      }

      // Fetch from server if no valid cache
      const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        // Cache the full data
        try {
          localStorage.setItem('allCourseSections', JSON.stringify(result.data))
          localStorage.setItem('allCourseSectionsTimestamp', Date.now().toString())
        } catch (error) {
          console.error('Error caching course sections:', error)
        }

        // Normalize course name helper
        const normalizeName = (name: string) => 
          name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

        // Filter courses by the selected course names with fuzzy matching
        const filteredSections = result.data.filter((course: CourseSection) => {
          const normalizedCourseTitle = normalizeName(course['Course Title'])
          return courseNames.some(selectedName => {
            const normalizedSelectedName = normalizeName(selectedName)
            return normalizedCourseTitle === normalizedSelectedName ||
                   normalizedCourseTitle.includes(normalizedSelectedName) ||
                   normalizedSelectedName.includes(normalizedCourseTitle)
          })
        })
        
        setCourseSections(filteredSections)
      } else {
        setCourseSections([])
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch course sections',
        icon: 'error',
        background: '#ffffff',
        color: '#1f2937',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters()
  }, [filters, courseSections])

  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ')
    let [hours, minutes] = timePart.split(':').map(Number)
    
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    
    return hours * 60 + minutes
  }

  // Prepare grouped sections data for auto generation
  const prepareAutoGenerationData = (sections: CourseSection[]) => {
    // Normalize course name
    const normalizeName = (name: string) => 
      name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

    // Group sections by course
    const sectionsByCourse = new Map<string, CourseSection[]>()
    
    sections.forEach(section => {
      const courseName = normalizeName(section['Course Title'])
      if (!sectionsByCourse.has(courseName)) {
        sectionsByCourse.set(courseName, [])
      }
      sectionsByCourse.get(courseName)?.push(section)
    })

    // For each course, group sections by unique time slots
    const groupedByCourse: Record<string, {
      timeSlotKey: string
      displayInfo: {
        days: string[]
        timeRanges: string[]
        classTypes: string[]
      }
      sections: CourseSection[]
    }[]> = {}

    sectionsByCourse.forEach((courseSections, courseName) => {
      const timeSlotGroups = new Map<string, CourseSection[]>()

      courseSections.forEach(section => {
        // Group sections by their unique days and overall time pattern
        // This matches the routine filter behavior where sections with same days are grouped
        
        // Extract unique days
        const days = new Set<string>()
        section.Time.forEach(t => days.add(t.Day))
        
        // Sort days consistently
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const sortedDays = Array.from(days).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
        
        // Extract unique time ranges (convert to minutes for consistency)
        const convertToMinutes = (time: string): number => {
          const [timePart, period] = time.split(' ')
          let [hours, minutes] = timePart.split(':').map(Number)
          if (period === 'PM' && hours !== 12) hours += 12
          if (period === 'AM' && hours === 12) hours = 0
          return hours * 60 + minutes
        }
        
        const timeRanges = new Set<string>()
        section.Time.forEach(t => {
          const startMin = convertToMinutes(t['Start Time'])
          const endMin = convertToMinutes(t['End Time'])
          timeRanges.add(`${startMin}-${endMin}`)
        })
        const sortedTimeRanges = Array.from(timeRanges).sort()
        
        // Create grouping key: days + time ranges (ignoring which day has which time)
        const timeKey = `${sortedDays.join(',')}|${sortedTimeRanges.join(',')}`

        if (!timeSlotGroups.has(timeKey)) {
          timeSlotGroups.set(timeKey, [])
        }
        timeSlotGroups.get(timeKey)?.push(section)
      })

      // Convert to array with display info
      const groups = Array.from(timeSlotGroups.entries()).map(([timeKey, sections]) => {
        // Get unique days, time ranges, and class types from the first section
        const firstSection = sections[0]
        const days = [...new Set(firstSection.Time.map(t => t.Day))]
        const timeRanges = [...new Set(firstSection.Time.map(t => `${t['Start Time']} - ${t['End Time']}`))]
        const classTypes = [...new Set(firstSection.Time.map(t => t['Class Type']))]

        return {
          timeSlotKey: timeKey,
          displayInfo: {
            days: days.sort((a, b) => {
              const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
              return dayOrder.indexOf(a) - dayOrder.indexOf(b)
            }),
            timeRanges,
            classTypes: classTypes.sort()
          },
          sections
        }
      })

      groupedByCourse[courseName] = groups
    })

    return groupedByCourse
  }

  const applyFilters = () => {
    let filtered = [...courseSections]

    if (filters.courses.length > 0) {
      filtered = filtered.filter(s => filters.courses.includes(s['Course Title']))
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(s =>
        s.Section.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        s['Course Title'].toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(s => filters.status.includes(s.Status))
    }

    if (filters.classType.length > 0) {
      filtered = filtered.filter(s => s.Time.some(t => filters.classType.includes(t['Class Type'])))
    }

    if (filters.time.length > 0) {
      filtered = filtered.filter(s => 
        s.Time.some(t => {
          const timeSlot = `${t['Start Time']} - ${t['End Time']}`
          return filters.time.includes(timeSlot)
        })
      )
    }

    if (filters.day.length > 0) {
      filtered = filtered.filter(s => {
        // For each selected day filter, check if the section matches
        return filters.day.some(selectedDayFilter => {
          // Collect all unique days from the entire section (all class types combined)
          const allDays = new Set<string>()
          s.Time.forEach(t => {
            allDays.add(t.Day)
          })
          
          // Sort and join all days from this section
          const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const sortedDays = Array.from(allDays).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
          const dayPair = sortedDays.join(', ')
          
          return dayPair === selectedDayFilter
        })
      })
    }

    if (filters.minSeats) {
      const minSeatsValue = filters.minSeats === '30+' ? 30 : parseInt(filters.minSeats)
      filtered = filtered.filter(s => {
        const availableSeats = parseInt(s.Capacity) - parseInt(s.Count)
        return availableSeats >= minSeatsValue
      })
    }

    setFilteredSections(filtered)
  }

  const handleSelectSection = (section: CourseSection) => {
    const isAlreadySelected = selectedSections.some(s => s._id === section._id)
    
    if (isAlreadySelected) {
      const updated = selectedSections.filter(s => s._id !== section._id)
      setSelectedSections(updated)
      localStorage.setItem('myRoutineSections', JSON.stringify(updated))
    } else {
      const clashCheck = checkTimeClash(section)
      if (clashCheck.hasClash) {
        Swal.fire({
          title: 'Time Clash Detected!',
          html: `<p>${clashCheck.clashDetails}</p><p class="mt-2 text-sm">This section conflicts with <strong>${clashCheck.clashingCourse}</strong></p>`,
          icon: 'warning',
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#3b82f6',
        })
        return
      }

      const courseAlreadySelected = selectedSections.some(s => s['Course Title'] === section['Course Title'])
      if (courseAlreadySelected) {
        Swal.fire({
          title: 'Course Already Selected',
          text: `You have already selected a section for ${section['Course Title']}`,
          icon: 'info',
          background: '#ffffff',
          color: '#1f2937',
          confirmButtonColor: '#3b82f6',
        })
        return
      }

      const updated = [...selectedSections, section]
      setSelectedSections(updated)
      localStorage.setItem('myRoutineSections', JSON.stringify(updated))
      
      Swal.fire({
        title: 'Section Added!',
        text: `${section['Course Title']} - Section ${section.Section}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1f2937',
      })
    }
  }

  const convertTimeToMinutes = (time: string): number => {
    return timeToMinutes(time)
  }

  const timeSlotsOverlap = (slot1Start: string, slot1End: string, slot2Start: string, slot2End: string): boolean => {
    const start1 = convertTimeToMinutes(slot1Start)
    const end1 = convertTimeToMinutes(slot1End)
    const start2 = convertTimeToMinutes(slot2Start)
    const end2 = convertTimeToMinutes(slot2End)

    return (start1 < end2 && end1 > start2)
  }

  const checkTimeClash = (newSection: CourseSection): { hasClash: boolean; clashingCourse?: string; clashDetails?: string } => {
    for (const selectedSection of selectedSections) {
      for (const newSlot of newSection.Time) {
        for (const existingSlot of selectedSection.Time) {
          if (newSlot.Day === existingSlot.Day) {
            if (timeSlotsOverlap(newSlot['Start Time'], newSlot['End Time'], existingSlot['Start Time'], existingSlot['End Time'])) {
              return {
                hasClash: true,
                clashingCourse: selectedSection['Course Title'],
                clashDetails: `${newSlot.Day} ${newSlot['Start Time']} - ${newSlot['End Time']} overlaps with ${existingSlot['Start Time']} - ${existingSlot['End Time']}`
              }
            }
          }
        }
      }
    }
    return { hasClash: false }
  }

  const activeFilterCount =
    filters.courses.length +
    filters.status.length +
    filters.classType.length +
    filters.time.length +
    filters.day.length +
    (filters.minSeats ? 1 : 0)

  // Get unique time slots from filtered sections (based on current course filter)
  const getAvailableTimeSlots = (): string[] => {
    let sectionsToCheck = courseSections
    
    // If course filter is active, only get time slots from those courses
    if (filters.courses.length > 0) {
      sectionsToCheck = courseSections.filter(s => filters.courses.includes(s['Course Title']))
    }
    
    const timeSlots = new Set<string>()
    sectionsToCheck.forEach(section => {
      section.Time.forEach(t => {
        const timeSlot = `${t['Start Time']} - ${t['End Time']}`
        timeSlots.add(timeSlot)
      })
    })
    
    // Sort time slots by start time
    return Array.from(timeSlots).sort((a, b) => {
      const timeA = a.split(' - ')[0]
      const timeB = b.split(' - ')[0]
      return timeToMinutes(timeA) - timeToMinutes(timeB)
    })
  }

  // Get unique days from filtered sections (based on current course filter)
  const getAvailableDays = (): string[] => {
    let sectionsToCheck = courseSections
    
    // If course filter is active, only get days from those courses
    if (filters.courses.length > 0) {
      sectionsToCheck = courseSections.filter(s => filters.courses.includes(s['Course Title']))
    }
    
    const dayPairs = new Set<string>()
    sectionsToCheck.forEach(section => {
      // Collect all unique days from the entire section (all class types combined)
      const allDays = new Set<string>()
      section.Time.forEach(t => {
        allDays.add(t.Day)
      })
      
      // Sort and join all days from this section
      if (allDays.size > 0) {
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const sortedDays = Array.from(allDays).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
        const dayPair = sortedDays.join(', ')
        dayPairs.add(dayPair)
      }
    })
    
    // Sort day pairs - single days first, then pairs
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return Array.from(dayPairs).sort((a, b) => {
      const aDays = a.split(', ')
      const bDays = b.split(', ')
      
      // Compare by first day
      const aFirstIndex = dayOrder.indexOf(aDays[0])
      const bFirstIndex = dayOrder.indexOf(bDays[0])
      
      if (aFirstIndex !== bFirstIndex) {
        return aFirstIndex - bFirstIndex
      }
      
      // If first day is same, compare by second day if exists
      if (aDays.length > 1 && bDays.length > 1) {
        return dayOrder.indexOf(aDays[1]) - dayOrder.indexOf(bDays[1])
      }
      
      // Single day comes before pair
      return aDays.length - bDays.length
    })
  }

  const availableTimeSlots = getAvailableTimeSlots()
  const availableDays = getAvailableDays()

  const groupedByCourse: { [key: string]: CourseSection[] } = {}
  filteredSections.forEach(section => {
    if (!groupedByCourse[section['Course Title']]) {
      groupedByCourse[section['Course Title']] = []
    }
    groupedByCourse[section['Course Title']].push(section)
  })

  if (isLoading) {
    return <RoutineSkeleton />
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
              onClick={() => router.push('/courses')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 rounded-lg shadow-sm"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline text-sm">Back to Courses</span>
              <span className="sm:hidden text-sm">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              Course Sections
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Select sections for your courses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => {
                // Group sections by time slots before navigating
                const groupedData = prepareAutoGenerationData(courseSections)
                localStorage.setItem('autoGenerateGroupedSections', JSON.stringify(groupedData))
                router.push('/courses/auto')
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors shadow-md w-full sm:w-auto"
            >
              <FiCalendar className="h-4 w-4 shrink-0" />
              <span className="text-sm sm:text-base">Auto Generate</span>
            </button>
            {selectedSections.length > 0 && (
              <>
                <button
                  onClick={clearRoutine}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md w-full sm:w-auto"
                >
                  <FiBook className="h-4 w-4 shrink-0" />
                  <span className="text-sm sm:text-base">Clear Routine</span>
                </button>
                <button
                  onClick={() => router.push('/courses/my-routine')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md w-full sm:w-auto"
                >
                  <FiCalendar className="h-4 w-4 shrink-0" />
                  <span className="text-sm sm:text-base">My Routine ({selectedSections.length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          selectedCourseNames={selectedCourseNames}
          availableTimeSlots={availableTimeSlots}
          availableDays={availableDays}
          activeFilterCount={activeFilterCount}
        />

        {/* Results Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiBook className="h-4 w-4 text-gray-500" />
              <span>
                Showing <strong className="text-gray-900">{filteredSections.length}</strong> section
                {filteredSections.length !== 1 ? 's' : ''} from{' '}
                <strong className="text-gray-900">{Object.keys(groupedByCourse).length}</strong> course
                {Object.keys(groupedByCourse).length !== 1 ? 's' : ''}
              </span>
            </div>
            {selectedSections.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiClock className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">
                  {selectedSections.length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Course Sections Tables */}
        <div className="space-y-4 sm:space-y-6">
          {Object.keys(groupedByCourse).length > 0 ? (
            Object.keys(groupedByCourse).map(courseTitle => (
              <CourseSectionsTable
                key={courseTitle}
                courseTitle={courseTitle}
                sections={groupedByCourse[courseTitle]}
                selectedSections={selectedSections}
                onSelectSection={handleSelectSection}
                checkTimeClash={checkTimeClash}
              />
            ))
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">No sections found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoutineContainer
