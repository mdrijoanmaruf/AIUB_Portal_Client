import React from 'react'
import Swal from 'sweetalert2'

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

    // Collect time slots grouped by course (to handle multi-slot courses correctly)
    const courseTimeSlots: { 
      courseId: string
      day: string
      start: number
      end: number 
    }[] = []

    sections.forEach(section => {
      const courseId = section['Course Title'] // Use course title as identifier
      section.Time.forEach(time => {
        courseTimeSlots.push({
          courseId,
          day: time.Day,
          start: timeToMinutes(time['Start Time']),
          end: timeToMinutes(time['End Time'])
        })
      })
    })

    // Group by day
    const dayGroups = courseTimeSlots.reduce((groups, slot) => {
      if (!groups[slot.day]) groups[slot.day] = []
      groups[slot.day].push(slot)
      return groups
    }, {} as Record<string, typeof courseTimeSlots>)

    // Check gaps for each day
    for (const day in dayGroups) {
      const daySlots = dayGroups[day].sort((a, b) => a.start - b.start)

      // Merge overlapping or adjacent slots from the same course
      const mergedSlots: { start: number; end: number }[] = []
      
      for (const slot of daySlots) {
        if (mergedSlots.length === 0) {
          mergedSlots.push({ start: slot.start, end: slot.end })
        } else {
          const last = mergedSlots[mergedSlots.length - 1]
          
          // If this slot overlaps or is adjacent to the last merged slot, extend the last slot
          if (slot.start <= last.end) {
            last.end = Math.max(last.end, slot.end)
          } else {
            // Check gap between last merged slot and current slot
            const gap = slot.start - last.end
            if (gap > maxGapMinutes) {
              return false
            }
            mergedSlots.push({ start: slot.start, end: slot.end })
          }
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
    setIsGenerating(true)
    setGeneratedRoutines([])
    // reset previous summary
    setGenerationSummary(null)

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      ;(async () => {
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

        // NEW: Group sections by unique time slots to reduce combinations
        const groupSectionsByTimeSlots = (sections: CourseSection[]): CourseSection[][] => {
          const timeSlotGroups = new Map<string, CourseSection[]>()

          sections.forEach(section => {
            // Create a unique key based on time slots (day + start time + end time + class type)
            const timeKey = section.Time
              .map(t => `${t.Day}|${t['Start Time']}|${t['End Time']}|${t['Class Type']}`)
              .sort()
              .join('::')

            if (!timeSlotGroups.has(timeKey)) {
              timeSlotGroups.set(timeKey, [])
            }
            timeSlotGroups.get(timeKey)?.push(section)
          })

          // Return array of groups (each group has sections with same time slots)
          return Array.from(timeSlotGroups.values())
        }

        // Group sections by time slots for each course
        const uniqueTimeSlotsByCourse = new Map<string, CourseSection[][]>()
        sectionsByCourse.forEach((sections, courseName) => {
          const grouped = groupSectionsByTimeSlots(sections)
          uniqueTimeSlotsByCourse.set(courseName, grouped)
        })

        // Check if we have sections for all selected courses
        const missingCourses = selectedCourses.filter(courseName => {
          const normalizedName = normalizeName(courseName)
          return !uniqueTimeSlotsByCourse.has(normalizedName) || uniqueTimeSlotsByCourse.get(normalizedName)!.length === 0
        })

        if (missingCourses.length > 0) {
          // report summary
          setGenerationSummary({
            totalPossible: 0,
            combinationsGenerated: 0,
            missingCourses,
            perCourseCounts: Object.fromEntries(Array.from(sectionsByCourse.entries()).map(([k, v]) => [k, v.length]))
          })
          // Show SweetAlert instead of native alert
          await Swal.fire({
            icon: 'warning',
            title: 'No available sections',
            html: `No available sections found for the following courses:<br><strong>${missingCourses.join(', ')}</strong><br>Please adjust your filters or select different courses.`,
          })
          setIsGenerating(false)
          return
        }

        // Generate all possible combinations using UNIQUE TIME SLOTS
        const courseNames = Array.from(uniqueTimeSlotsByCourse.keys())
        const combinations: CourseSection[][] = []

        // Estimate total possible combinations based on unique time slots (much fewer!)
        const totalPossible = courseNames.reduce((total, courseName) => {
          const timeSlotGroups = uniqueTimeSlotsByCourse.get(courseName) || []
          return total * Math.max(timeSlotGroups.length, 1)
        }, 1)

        // Report preliminary summary (before generation)
        setGenerationSummary({
          totalPossible,
          combinationsGenerated: 0,
          missingCourses: [],
          perCourseCounts: Object.fromEntries(Array.from(sectionsByCourse.entries()).map(([k, v]) => [k, v.length]))
        })

        if (totalPossible > 200) {
          await Swal.fire({
            title: 'This may take a while',
            html: `This will generate approximately <strong>${totalPossible.toLocaleString()}</strong> possible routines. Only the first 20 will be displayed.`,
            icon: 'info',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
          })

          // Show a loading modal immediately after the warning
          Swal.fire({
            title: 'Generating...',
            html: 'Please wait while we compute routines.',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading()
            }
          })
        }

        const generateCombinations = (index: number, current: CourseSection[]) => {
          if (index === courseNames.length) {
            // Only add complete combinations (must include all courses)
            if (current.length === courseNames.length) {
              combinations.push([...current])
            }
            return
          }

          // Get all time slot groups for this course
          const timeSlotGroups = uniqueTimeSlotsByCourse.get(courseNames[index]) || []

          // Must have at least one time slot group available for this course
          if (timeSlotGroups.length === 0) {
            return // Cannot proceed without sections for this course
          }

          // Try each unique time slot group (not each individual section)
          for (const sectionGroup of timeSlotGroups) {
            // Pick the first section from the group as representative (all have same time slots)
            const representativeSection = sectionGroup[0]

            // Check for conflicts with current routine
            let hasConflict = false
            for (const existingSection of current) {
              if (hasTimeConflict(representativeSection, existingSection)) {
                hasConflict = true
                break
              }
            }

            if (!hasConflict) {
              current.push(representativeSection)
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

        // Convert to Routine format - only complete routines
        let routines: Routine[] = combinations
          .filter(sections => sections.length === courseNames.length) // Must include ALL courses
          .map(sections => ({
            sections,
            conflicts: 0
          }))

        // Limit to 20 routines if there are more than 20
        const isLimited = routines.length > 20
        if (isLimited) {
          routines = routines.slice(0, 20)
        }

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
          // Close any SweetAlert loading modal if open
          try {
            Swal.close()
          } catch (e) {
            // ignore
          }
          setIsGenerating(false)
        }
      })()
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