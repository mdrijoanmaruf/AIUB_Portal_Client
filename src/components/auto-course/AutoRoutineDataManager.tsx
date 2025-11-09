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

interface SectionGroup {
  timeSlotKey: string
  displayInfo: {
    days: string[]
    timeRanges: string[]
    classTypes: string[]
  }
  sections: CourseSection[]
}

interface GroupedSections {
  [courseName: string]: SectionGroup[]
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
    groupedSections: GroupedSections
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
    generationSummary: {
      totalPossible: number
      combinationsGenerated: number
      missingCourses: string[]
      perCourseCounts?: Record<string, number>
    } | null
    setGenerationSummary: (summary: {
      totalPossible: number
      combinationsGenerated: number
      missingCourses: string[]
      perCourseCounts?: Record<string, number>
    } | null) => void

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
  const [selectedDays, setSelectedDays] = useState<string[]>(['Sunday', 'Monday', 'Tuesday', 'Wednesday'])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Open'])
  const [minSeats, setMinSeats] = useState<string>('')
  const [maxGap, setMaxGap] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRoutines, setGeneratedRoutines] = useState<Routine[]>([])
  const [groupedSections, setGroupedSections] = useState<GroupedSections>({})
  const [isLoadingSections, setIsLoadingSections] = useState(true)
  const [generationSummary, setGenerationSummary] = useState<{
    totalPossible: number
    combinationsGenerated: number
    missingCourses: string[]
    perCourseCounts?: Record<string, number>
  } | null>(null)

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

    // Load pre-grouped sections from localStorage
    const storedGroupedSections = localStorage.getItem('autoGenerateGroupedSections')
    if (storedGroupedSections) {
      try {
        const parsedGrouped = JSON.parse(storedGroupedSections)
        setGroupedSections(parsedGrouped)
        setIsLoadingSections(false)
      } catch (error) {
        console.error('Error parsing grouped sections:', error)
        setIsLoadingSections(false)
      }
    } else {
      setIsLoadingSections(false)
    }
  }, [])

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

  // Get unique status values from grouped sections
  const getAvailableStatuses = (): string[] => {
    const statuses = new Set<string>()
    Object.values(groupedSections).forEach(groups => {
      groups.forEach(group => {
        group.sections.forEach(section => {
          if (section.Status) {
            statuses.add(section.Status)
          }
        })
      })
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
        groupedSections,
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
        generationSummary,
        setGenerationSummary,

        // Actions
        toggleDay,
        toggleStatus,
        getAvailableStatuses
      })}
    </>
  )
}

export default AutoRoutineDataManager