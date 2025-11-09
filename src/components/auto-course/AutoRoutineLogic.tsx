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

interface AutoRoutineLogicProps {
  groupedSections: GroupedSections
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
  }) => React.ReactNode
}

const AutoRoutineLogic: React.FC<AutoRoutineLogicProps> = ({
  groupedSections,
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
      const courseId = section['Course Title']
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

      // Merge overlapping or adjacent slots
      const mergedSlots: { start: number; end: number }[] = []
      
      for (const slot of daySlots) {
        if (mergedSlots.length === 0) {
          mergedSlots.push({ start: slot.start, end: slot.end })
        } else {
          const last = mergedSlots[mergedSlots.length - 1]
          
          if (slot.start <= last.end) {
            last.end = Math.max(last.end, slot.end)
          } else {
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

  // Filter section groups based on user preferences
  const filterGroupByPreferences = (group: SectionGroup): boolean => {
    const userStartMinutes = timeToMinutes(startTime)
    const userEndMinutes = timeToMinutes(endTime)

    // Check if all days in the group are within selected days
    for (const day of group.displayInfo.days) {
      if (!selectedDays.includes(day)) {
        return false
      }
    }

    // Check time slots - use first section as representative (all have same times)
    const representativeSection = group.sections[0]
    for (const time of representativeSection.Time) {
      const sectionStart = timeToMinutes(time['Start Time'])
      const sectionEnd = timeToMinutes(time['End Time'])

      if (sectionStart < userStartMinutes || sectionEnd > userEndMinutes) {
        return false
      }
    }

    // Filter sections within the group by status and minSeats
    const filteredSections = group.sections.filter(section => {
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

      return true
    })

    // Group is valid only if it has at least one section that passes all filters
    return filteredSections.length > 0
  }

  const generateRoutines = () => {
    setIsGenerating(true)
    setGeneratedRoutines([])
    setGenerationSummary(null)

    setTimeout(() => {
      ;(async () => {
        try {
          // Normalize course name
          const normalizeName = (name: string) =>
            name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

          // Filter groups based on user preferences for each course
          const filteredGroupsByCourse = new Map<string, SectionGroup[]>()
          
          selectedCourses.forEach(courseName => {
            const normalizedName = normalizeName(courseName)
            const courseGroups = groupedSections[normalizedName] || []
            
            // Filter groups that match user preferences
            const validGroups = courseGroups.filter(filterGroupByPreferences)
            
            if (validGroups.length > 0) {
              filteredGroupsByCourse.set(normalizedName, validGroups)
            }
          })

          // Check if we have valid groups for all selected courses
          const missingCourses = selectedCourses.filter(courseName => {
            const normalizedName = normalizeName(courseName)
            return !filteredGroupsByCourse.has(normalizedName) || 
                   filteredGroupsByCourse.get(normalizedName)!.length === 0
          })

          // Calculate per-course counts (number of sections available after filtering)
          const perCourseCounts: Record<string, number> = {}
          filteredGroupsByCourse.forEach((groups, courseName) => {
            const totalSections = groups.reduce((sum, group) => {
              // Count sections within each group that pass status/minSeats filters
              const validSections = group.sections.filter(section => {
                if (selectedStatuses.length > 0 && !selectedStatuses.includes(section.Status)) {
                  return false
                }
                if (minSeats) {
                  const availableSeats = parseInt(section.Capacity) - parseInt(section.Count)
                  const minSeatsValue = minSeats === '30+' ? 30 : parseInt(minSeats)
                  if (availableSeats < minSeatsValue) {
                    return false
                  }
                }
                return true
              })
              return sum + validSections.length
            }, 0)
            perCourseCounts[courseName] = totalSections
          })

          if (missingCourses.length > 0) {
            setGenerationSummary({
              totalPossible: 0,
              combinationsGenerated: 0,
              missingCourses,
              perCourseCounts
            })
            
            await Swal.fire({
              icon: 'warning',
              title: 'No available sections',
              html: `No available sections found for the following courses:<br><strong>${missingCourses.join(', ')}</strong><br>Please adjust your filters or select different courses.`,
            })
            setIsGenerating(false)
            return
          }

          // Calculate total possible combinations
          const courseNames = Array.from(filteredGroupsByCourse.keys())
          const totalPossible = courseNames.reduce((total, courseName) => {
            const groups = filteredGroupsByCourse.get(courseName) || []
            return total * Math.max(groups.length, 1)
          }, 1)

          setGenerationSummary({
            totalPossible,
            combinationsGenerated: 0,
            missingCourses: [],
            perCourseCounts
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

            Swal.fire({
              title: 'Generating...',
              html: 'Please wait while we compute routines.',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading()
              }
            })
          }

          // Generate combinations by picking one section from each course's groups
          const combinations: CourseSection[][] = []

          const generateCombinations = (index: number, current: CourseSection[]) => {
            if (index === courseNames.length) {
              if (current.length === courseNames.length) {
                combinations.push([...current])
              }
              return
            }

            const groups = filteredGroupsByCourse.get(courseNames[index]) || []
            
            if (groups.length === 0) {
              return
            }

            // Try each group (each represents a unique time slot pattern)
            for (const group of groups) {
              // Filter sections within the group by status and minSeats
              const validSections = group.sections.filter(section => {
                if (selectedStatuses.length > 0 && !selectedStatuses.includes(section.Status)) {
                  return false
                }
                if (minSeats) {
                  const availableSeats = parseInt(section.Capacity) - parseInt(section.Count)
                  const minSeatsValue = minSeats === '30+' ? 30 : parseInt(minSeats)
                  if (availableSeats < minSeatsValue) {
                    return false
                  }
                }
                return true
              })

              if (validSections.length === 0) continue

              // Pick the first valid section as representative
              const representativeSection = validSections[0]

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
                if (hasAcceptableGaps(current)) {
                  generateCombinations(index + 1, current)
                }
                current.pop()
              }
            }
          }

          generateCombinations(0, [])

          // Convert to Routine format
          let routines: Routine[] = combinations
            .filter(sections => sections.length === courseNames.length)
            .map(sections => ({
              sections,
              conflicts: 0
            }))

          // Limit to 20 routines
          if (routines.length > 20) {
            routines = routines.slice(0, 20)
          }

          setGenerationSummary({
            totalPossible,
            combinationsGenerated: routines.length,
            missingCourses: [],
            perCourseCounts
          })

          setGeneratedRoutines(routines)

          // Show SweetAlert if no routines were generated
          if (routines.length === 0) {
            const perCourseList = Object.entries(perCourseCounts)
              .map(([course, count]) => `<li>${course}: ${count} sections</li>`)
              .join('')

            await Swal.fire({
              icon: 'warning',
              title: 'No Complete Routines Found',
              html: `
                <p>We estimated approximately <strong>${totalPossible.toLocaleString()}</strong> possible combinations, but none of the complete schedules passed your conflict and gap rules.</p>
                <div style="text-align: left; margin-top: 16px;">
                  <p style="font-weight: 600; margin-bottom: 8px;">Available sections per course (after applying your filters):</p>
                  <ul style="margin-left: 20px; margin-bottom: 12px;">
                    ${perCourseList}
                  </ul>
                  <p style="margin-top: 12px;">Try relaxing your filters (wider time range, more days selected, increase maximum gap, or lower minimum seats) to allow complete routines.</p>
                </div>
              `,
              confirmButtonText: 'OK',
              confirmButtonColor: '#9333ea'
            })
          }
        } catch (error) {
          console.error('Error generating routines:', error)
        } finally {
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
        generateRoutines
      })}
    </>
  )
}

export default AutoRoutineLogic