import React from 'react'

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

interface AutoRoutineLogicProps {
  allSections: CourseSection[]
  selectedCourses: string[]
  startTime: string
  endTime: string
  selectedDays: string[]
  selectedStatuses: string[]
  minSeats: string
  maxGap: string
  setIsGenerating: (generating: boolean) => void
  setGeneratedRoutines: (routines: Routine[]) => void
  setGenerationSummary: (summary: {
    totalPossible: number
    combinationsGenerated: number
    missingCourses: string[]
    perCourseCounts?: Record<string, number>
  } | null) => void
  children: (props: {
    generateRoutines: () => void
    timeToMinutes: (time: string) => number
    hasTimeConflict: (section1: CourseSection, section2: CourseSection) => boolean
    hasAcceptableGaps: (sections: CourseSection[]) => boolean
    filterSectionByPreferences: (section: CourseSection) => boolean
  }) => React.ReactNode
}

const AutoRoutineLogic: React.FC<AutoRoutineLogicProps> = ({
  allSections,
  selectedCourses,
  startTime,
  endTime,
  selectedDays,
  selectedStatuses,
  minSeats,
  maxGap,
  setIsGenerating,
  setGeneratedRoutines,
  setGenerationSummary,
  children
}) => {
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
  // reset previous summary
  setGenerationSummary(null)

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
        console.log('Number of selected courses:', selectedCourses.length)

        // Check if we have sections for all selected courses
        const missingCourses = selectedCourses.filter(courseName => {
          const normalizedName = normalizeName(courseName)
          return !sectionsByCourse.has(normalizedName) || sectionsByCourse.get(normalizedName)!.length === 0
        })

        if (missingCourses.length > 0) {
          console.log('Missing sections for courses:', missingCourses)
          // report summary and notify user
          setGenerationSummary({
            totalPossible: 0,
            combinationsGenerated: 0,
            missingCourses,
            perCourseCounts: Object.fromEntries(Array.from(sectionsByCourse.entries()).map(([k, v]) => [k, v.length]))
          })
          alert(`No available sections found for the following courses: ${missingCourses.join(', ')}. Please adjust your filters or select different courses.`)
          setIsGenerating(false)
          return
        }

        // Generate all possible combinations - ONLY complete routines
        const courseNames = Array.from(sectionsByCourse.keys())
        const combinations: CourseSection[][] = []

        // Estimate total possible combinations
        const totalPossible = courseNames.reduce((total, courseName) => {
          const sections = sectionsByCourse.get(courseName) || []
          return total * Math.max(sections.length, 1)
        }, 1)

        console.log('Estimated total possible combinations:', totalPossible)

        // Report preliminary summary (before generation)
        setGenerationSummary({
          totalPossible,
          combinationsGenerated: 0,
          missingCourses: [],
          perCourseCounts: Object.fromEntries(Array.from(sectionsByCourse.entries()).map(([k, v]) => [k, v.length]))
        })

        if (totalPossible > 200) {
          const proceed = confirm(`This will generate approximately ${totalPossible} possible routines. Only the first 50 will be displayed. This may take a while. Do you want to proceed?`)
          if (!proceed) {
            setIsGenerating(false)
            return
          }
        }

        const generateCombinations = (index: number, current: CourseSection[]) => {
          if (index === courseNames.length) {
            // Only add complete combinations (must include all courses)
            if (current.length === courseNames.length) {
              combinations.push([...current])
            }
            return
          }

          const courseSections = sectionsByCourse.get(courseNames[index]) || []

          // Must have sections available for this course
          if (courseSections.length === 0) {
            return // Cannot proceed without sections for this course
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

          // Do NOT allow skipping courses - each routine must include ALL courses
        }

        generateCombinations(0, [])

        console.log('Total complete combinations generated:', combinations.length)

        // Convert to Routine format - only complete routines
        let routines: Routine[] = combinations
          .filter(sections => sections.length === courseNames.length) // Must include ALL courses
          .map(sections => ({
            sections,
            conflicts: 0
          }))

        // Limit to 50 routines if there are more than 50
        const isLimited = routines.length > 50
        if (isLimited) {
          routines = routines.slice(0, 50)
        }

        console.log('Final complete routines:', routines.length, isLimited ? '(showing first 50 of many)' : '(showing all)')
        // Update summary with final counts
        setGenerationSummary({
          totalPossible,
          combinationsGenerated: routines.length,
          missingCourses: [],
          perCourseCounts: Object.fromEntries(Array.from(sectionsByCourse.entries()).map(([k, v]) => [k, v.length]))
        })
        setGeneratedRoutines(routines)
      } catch (error) {
        console.error('Error generating routines:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 100)
  }

  return (
    <>
      {children({
        generateRoutines,
        timeToMinutes,
        hasTimeConflict,
        hasAcceptableGaps,
        filterSectionByPreferences
      })}
    </>
  )
}

export default AutoRoutineLogic