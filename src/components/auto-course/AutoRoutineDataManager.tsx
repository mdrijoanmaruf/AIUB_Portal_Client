import React, { useState, useEffect } from 'react'

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

interface AutoRoutineDataManagerProps {
  children: (props: {
    // State
    selectedCourses: string[]
    startTime: string
    endTime: string
    selectedDays: string[]
    selectedStatuses: string[]
    minSeats: string
    maxGap: string
    isGenerating: boolean
    generatedRoutines: Routine[]
    allSections: CourseSection[]
    isLoadingSections: boolean

    // State setters
    setStartTime: (time: string) => void
    setEndTime: (time: string) => void
    setSelectedDays: (days: string[]) => void
    setSelectedStatuses: (statuses: string[]) => void
    setMinSeats: (seats: string) => void
    setMaxGap: (gap: string) => void
    setIsGenerating: (generating: boolean) => void
    setGeneratedRoutines: (routines: Routine[]) => void

    // Actions
    toggleDay: (day: string) => void
    toggleStatus: (status: string) => void
    getAvailableStatuses: () => string[]
  }) => React.ReactNode
}

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

const AutoRoutineDataManager: React.FC<AutoRoutineDataManagerProps> = ({ children }) => {
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

  return (
    <>
      {children({
        // State
        selectedCourses,
        startTime,
        endTime,
        selectedDays,
        selectedStatuses,
        minSeats,
        maxGap,
        isGenerating,
        generatedRoutines,
        allSections,
        isLoadingSections,

        // State setters
        setStartTime,
        setEndTime,
        setSelectedDays,
        setSelectedStatuses,
        setMinSeats,
        setMaxGap,
        setIsGenerating,
        setGeneratedRoutines,

        // Actions
        toggleDay,
        toggleStatus,
        getAvailableStatuses
      })}
    </>
  )
}

export default AutoRoutineDataManager