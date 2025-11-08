import React, { useMemo } from 'react'
import { FiDownload } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { toPng } from 'html-to-image'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

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

interface GeneratedRoutineDesignProps {
  routine: Routine
  index: number
  selectedCourses: string[]
  selectedDays: string[]
  startTime: string
  endTime: string
  allSections: CourseSection[]
  selectedStatuses: string[]
  minSeats: string
  onDownload: (index: number) => void
  onSave: (routine: Routine) => void
}

const GeneratedRoutineDesign: React.FC<GeneratedRoutineDesignProps> = ({
  routine,
  index,
  selectedCourses,
  selectedDays,
  startTime,
  endTime,
  onDownload,
  onSave,
  allSections,
  selectedStatuses,
  minSeats,
}) => {
  const router = useRouter()

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

  const normalizeDay = (d: string) => d.trim().slice(0,3).toLowerCase()

  // Get unique days used in this routine
  const getUsedDays = () => {
    const usedDays = new Set<string>()
    routine.sections.forEach(section => {
      section.Time.forEach(time => {
        usedDays.add(time.Day)
      })
    })
    // Return only selected days that are actually used in the routine
    return selectedDays.filter(day => 
      Array.from(usedDays).some(usedDay => normalizeDay(usedDay) === normalizeDay(day))
    )
  }

  // Generate time slots based on actual classes in the routine (every 1 hour)
  const generateTimeSlots = () => {
    // Find the earliest and latest times used in the routine
    let earliestMinutes = Infinity
    let latestMinutes = 0

    routine.sections.forEach(section => {
      section.Time.forEach(time => {
        const start = timeToMinutes(time['Start Time'])
        const end = timeToMinutes(time['End Time'])
        earliestMinutes = Math.min(earliestMinutes, start)
        latestMinutes = Math.max(latestMinutes, end)
      })
    })

    // If no classes found, return empty
    if (earliestMinutes === Infinity) return []

    // Round down to nearest hour for start, round up to nearest hour for end
    const startHour = Math.floor(earliestMinutes / 60)
    const endHour = Math.ceil(latestMinutes / 60)

    const slots: string[] = []
    for (let hours = startHour; hours <= endHour; hours++) {
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      const ampm = hours >= 12 ? 'PM' : 'AM'
      slots.push(`${hour12}:00 ${ampm}`)
    }

    return slots
  }

  const usedDays = getUsedDays()

  // Get dynamic time range based on actual classes
  const getTimeRange = () => {
    let earliestMinutes = Infinity
    let latestMinutes = 0

    routine.sections.forEach(section => {
      section.Time.forEach(time => {
        const start = timeToMinutes(time['Start Time'])
        const end = timeToMinutes(time['End Time'])
        earliestMinutes = Math.min(earliestMinutes, start)
        latestMinutes = Math.max(latestMinutes, end)
      })
    })

    if (earliestMinutes === Infinity) {
      return { min: new Date(2025, 0, 1, 8, 0, 0), max: new Date(2025, 0, 1, 18, 0, 0) }
    }

    // Round down to nearest hour for start
    const startHour = Math.floor(earliestMinutes / 60)
    // Round up to nearest hour for end
    const endHour = Math.ceil(latestMinutes / 60)

    return {
      min: new Date(2025, 0, 1, startHour, 0, 0),
      max: new Date(2025, 0, 1, endHour, 0, 0)
    }
  }

  const timeRange = getTimeRange()

  // Get list of day indices that have classes
  const getActiveDayIndices = () => {
    const dayMap: Record<string, number> = {
      'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
    }
    const activeDays = new Set<number>()
    
    routine.sections.forEach(section => {
      section.Time.forEach(timeSlot => {
        const dayIndex = dayMap[normalizeDay(timeSlot.Day)]
        if (dayIndex !== undefined) {
          activeDays.add(dayIndex)
        }
      })
    })
    
    return Array.from(activeDays).sort((a, b) => a - b)
  }

  const activeDayIndices = getActiveDayIndices()

  // Convert routine sections to calendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = []
    const dayMap: Record<string, number> = {
      'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
    }

    // Get the days that are actually used in the routine
    const usedDayIndices = new Set<number>()
    routine.sections.forEach(section => {
      section.Time.forEach(timeSlot => {
        const dayIndex = dayMap[normalizeDay(timeSlot.Day)]
        if (dayIndex !== undefined) {
          usedDayIndices.add(dayIndex)
        }
      })
    })

    // Find a week that contains all the needed days
    // We'll use a fixed reference week (first week of 2025)
    const referenceDate = new Date(2025, 0, 5) // Jan 5, 2025 is a Sunday

    routine.sections.forEach((section) => {
      section.Time.forEach((timeSlot) => {
        const dayIndex = dayMap[normalizeDay(timeSlot.Day)]
        if (dayIndex === undefined) return

        // Calculate the date for this day
        const eventDate = new Date(referenceDate)
        eventDate.setDate(referenceDate.getDate() + dayIndex)

        // Parse start and end times
        const startTime = timeSlot['Start Time']
        const endTime = timeSlot['End Time']
        
        const parseTime = (time: string) => {
          const trimmed = time.trim()
          let hours = 0
          let minutes = 0

          if (trimmed.includes('AM') || trimmed.includes('PM')) {
            const [timePart, period] = trimmed.split(' ')
            const [h, m] = timePart.split(':').map(Number)
            hours = h
            minutes = m
            if (period === 'PM' && hours !== 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0
          } else {
            const [h, m] = trimmed.split(':').map(Number)
            hours = h
            minutes = m
          }

          return { hours, minutes }
        }

        const start = parseTime(startTime)
        const end = parseTime(endTime)

        const startDate = new Date(eventDate)
        startDate.setHours(start.hours, start.minutes, 0, 0)

        const endDate = new Date(eventDate)
        endDate.setHours(end.hours, end.minutes, 0, 0)

        // Get all matching sections for this course/time/day
        const normalize = (name: string) => name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()
        const normTitle = normalize(section['Course Title'])

        const matchingSections = allSections.filter((sec: CourseSection) => {
          const secTitle = normalize(sec['Course Title'])
          if (secTitle !== normTitle && !secTitle.includes(normTitle) && !normTitle.includes(secTitle)) return false

          if (selectedStatuses.length > 0 && !selectedStatuses.includes(sec.Status)) return false

          if (minSeats) {
            const availableSeats = parseInt(sec.Capacity) - parseInt(sec.Count)
            const minSeatsValue = minSeats === '30+' ? 30 : parseInt(minSeats)
            if (availableSeats < minSeatsValue) return false
          }

          const dayNorm = normalizeDay(timeSlot.Day)
          const selStart = timeToMinutes(timeSlot['Start Time'])
          const selEnd = timeToMinutes(timeSlot['End Time'])

          // Check if ALL time slots match exactly (same day, same start, same end)
          if (sec.Time.length !== section.Time.length) return false

          // Create a set of time slot signatures for the current section
          const sectionTimeSlots = new Set(
            section.Time.map(t => 
              `${normalizeDay(t.Day)}|${timeToMinutes(t['Start Time'])}|${timeToMinutes(t['End Time'])}`
            )
          )

          // Check if all time slots in sec match the section's time slots
          return sec.Time.every((t: any) => {
            const timeSlotKey = `${normalizeDay(t.Day)}|${timeToMinutes(t['Start Time'])}|${timeToMinutes(t['End Time'])}`
            return sectionTimeSlots.has(timeSlotKey)
          })
        })

        const sectionList = matchingSections.map((s: CourseSection) => {
          const count = parseInt(s.Count)
          const capacity = parseInt(s.Capacity)
          return `${s.Section} (${count}/${capacity})`
        }).join(', ') || section.Section

        events.push({
          title: section['Course Title'],
          start: startDate,
          end: endDate,
          resource: {
            section: sectionList,
            className: timeSlot['Class Name'],
            courseTitle: section['Course Title'],
            originalSection: section
          }
        })
      })
    })

    return events
  }, [routine, allSections, selectedStatuses, minSeats])

  // Custom event style getter with professional color combinations
  const eventStyleGetter = (event: any) => {
    const colorClass = courseColors.get(event.resource.courseTitle)
    const colorMap: Record<string, { background: string; titleColor: string; sectionColor: string; classColor: string }> = {
      'bg-blue-100 border-blue-300 text-blue-900': { 
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', // Deep Blue
        titleColor: '#ffffff',
        sectionColor: '#fbbf24', // Amber
        classColor: '#e0e7ff'
      },
      'bg-purple-100 border-purple-300 text-purple-900': { 
        background: 'linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%)', // Rich Purple
        titleColor: '#ffffff',
        sectionColor: '#a78bfa', // Light Purple
        classColor: '#fde047'
      },
      'bg-green-100 border-green-300 text-green-900': { 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', // Emerald Green
        titleColor: '#ffffff',
        sectionColor: '#fcd34d', // Yellow
        classColor: '#d1fae5'
      },
      'bg-orange-100 border-orange-300 text-orange-900': { 
        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', // Vibrant Orange
        titleColor: '#ffffff',
        sectionColor: '#fed7aa', // Peach
        classColor: '#fef3c7'
      },
      'bg-pink-100 border-pink-300 text-pink-900': { 
        background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', // Hot Pink
        titleColor: '#ffffff',
        sectionColor: '#fcd34d', // Yellow
        classColor: '#fce7f3'
      },
      'bg-cyan-100 border-cyan-300 text-cyan-900': { 
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', // Cyan
        titleColor: '#ffffff',
        sectionColor: '#fde047', // Yellow
        classColor: '#cffafe'
      },
      'bg-indigo-100 border-indigo-300 text-indigo-900': { 
        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', // Indigo
        titleColor: '#ffffff',
        sectionColor: '#a5f3fc', // Light Cyan
        classColor: '#e0e7ff'
      },
      'bg-teal-100 border-teal-300 text-teal-900': { 
        background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)', // Teal
        titleColor: '#ffffff',
        sectionColor: '#fbbf24', // Amber
        classColor: '#ccfbf1'
      },
    }

    const colors = colorMap[colorClass || ''] || { 
      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
      titleColor: '#ffffff',
      sectionColor: '#fbbf24',
      classColor: '#e0e7ff'
    }

    return {
      style: {
        background: colors.background,
        color: colors.titleColor,
        borderRadius: '6px',
        opacity: 1,
        display: 'block',
        fontSize: '0.875rem',
        padding: '8px 10px',
        border: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      titleColor: colors.titleColor,
      sectionColor: colors.sectionColor,
      classColor: colors.classColor
    }
  }

  // Custom event component with dynamic colors
  const CustomEvent = ({ event }: any) => {
    const colorClass = courseColors.get(event.resource.courseTitle)
    const colorMap: Record<string, { background: string; titleColor: string; sectionColor: string; classColor: string }> = {
      'bg-blue-100 border-blue-300 text-blue-900': { 
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fbbf24',
        classColor: '#e0e7ff'
      },
      'bg-purple-100 border-purple-300 text-purple-900': { 
        background: 'linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%)',
        titleColor: '#ffffff',
        sectionColor: '#a78bfa',
        classColor: '#fde047'
      },
      'bg-green-100 border-green-300 text-green-900': { 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fcd34d',
        classColor: '#d1fae5'
      },
      'bg-orange-100 border-orange-300 text-orange-900': { 
        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fed7aa',
        classColor: '#fef3c7'
      },
      'bg-pink-100 border-pink-300 text-pink-900': { 
        background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fcd34d',
        classColor: '#fce7f3'
      },
      'bg-cyan-100 border-cyan-300 text-cyan-900': { 
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fde047',
        classColor: '#cffafe'
      },
      'bg-indigo-100 border-indigo-300 text-indigo-900': { 
        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
        titleColor: '#ffffff',
        sectionColor: '#a5f3fc',
        classColor: '#e0e7ff'
      },
      'bg-teal-100 border-teal-300 text-teal-900': { 
        background: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
        titleColor: '#ffffff',
        sectionColor: '#fbbf24',
        classColor: '#ccfbf1'
      },
    }
    
    const colors = colorMap[colorClass || ''] || { 
      background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
      titleColor: '#ffffff',
      sectionColor: '#fbbf24',
      classColor: '#e0e7ff'
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-0.5 sm:space-y-1 leading-tight p-1">
        <div className="font-bold text-sm sm:text-xs md:text-xs lg:text-xs xl:text-xs leading-tight" style={{ color: colors.titleColor }}>
          {event.title}
        </div>
        <div className="text-sm sm:text-xs md:text-xs lg:text-xs xl:text-xs leading-tight" style={{ color: colors.sectionColor }}>
          Sec: {event.resource.section.split(', ').map((section: string, idx: number) => {
            const [sectionName, ...rest] = section.split(' ');
            const restText = rest.join(' ');
            return (
              <span key={idx}>
                <span className="font-bold">{sectionName}</span> {restText}
                {idx < event.resource.section.split(', ').length - 1 && ', '}
              </span>
            );
          })}
        </div>
        <div className="text-xs sm:text-xs md:text-xs lg:text-xs xl:text-xs leading-tight" style={{ color: colors.classColor, opacity: 0.95 }}>
          {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
      </div>
    )
  }

  const saveRoutine = (routine: Routine) => {
    localStorage.setItem('myRoutineSections', JSON.stringify(routine.sections))
    router.push('/courses/my-routine')
  }

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
    <div className="border border-gray-200 rounded-lg overflow-hidden w-full">
      <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
              Routine Option {index + 1}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Complete routine with all {selectedCourses.length} courses
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {/* Download button hidden - handled by parent container */}
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div
        id={`routine-${index}`}
        className="p-3 sm:p-4 md:p-6 bg-white w-full overflow-x-auto"
      >
        <div className="mb-3 sm:mb-4">
          <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Weekly Schedule</h4>
          <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
            <span>Routine Option {index + 1}</span>
            <span className="text-purple-600 font-medium">← Swipe to see all days →</span>
          </p>
        </div>

          <div 
            id={`routine-grid-${index}`}
            className="relative routine-calendar-container overflow-x-auto scrollbar-hide"
            style={{ height: 'auto', minHeight: '500px' }}
            data-active-days={activeDayIndices.join(',')}
          >
            <style>{`
              /* Hide scrollbar but keep functionality */
              #routine-grid-${index} {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }

              #routine-grid-${index}::-webkit-scrollbar {
                display: none;
              }

              #routine-grid-${index} .rbc-time-header {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }

              #routine-grid-${index} .rbc-time-header::-webkit-scrollbar {
                display: none;
              }

              #routine-grid-${index} .rbc-time-content {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }

              #routine-grid-${index} .rbc-time-content::-webkit-scrollbar {
                display: none;
              }            /* Mobile view - Horizontal scroll */
            #routine-grid-${index} .rbc-calendar {
              width: 100%;
              min-width: 100%;
            }

            #routine-grid-${index} .rbc-time-view {
              width: 100%;
              min-width: 100%;
            }

            /* Mobile view - Make each day column take more width for scrolling */
            #routine-grid-${index} .rbc-day-slot {
              min-width: 50vw !important;
              width: 50vw !important;
              flex: 0 0 50vw !important;
            }

            #routine-grid-${index} .rbc-header {
              min-width: 50vw !important;
              width: 50vw !important;
              flex: 0 0 50vw !important;
            }

            /* When downloading, adjust to fixed width */
            #routine-grid-${index}[data-downloading="true"] .rbc-day-slot {
              min-width: 300px !important;
              width: 300px !important;
              flex: 0 0 300px !important;
              margin: 0 !important;
              padding: 0 !important;
              gap: 0 !important;
              border: none !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-header {
              min-width: 300px !important;
              width: 300px !important;
              flex: 0 0 300px !important;
              margin: 0 !important;
              padding: 8px 6px !important;
              gap: 0 !important;
              border: none !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-time-view {
              gap: 0 !important;
              border: none !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-calendar {
              gap: 0 !important;
              border: none !important;
            }

            #routine-grid-${index}[data-downloading="true"] * {
              gap: 0 !important;
            }

            /* Download mode: Compact sizing */
            #routine-grid-${index}[data-downloading="true"] .rbc-event {
              padding: 2px 4px !important;
              font-size: 0.6rem !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-calendar {
              font-size: 0.6rem !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-header {
              padding: 4px 3px !important;
              font-size: 0.65rem !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-label {
              font-size: 0.6rem !important;
              padding: 2px 3px !important;
            }

            #routine-grid-${index}[data-downloading="true"] .rbc-timeslot-group {
              min-height: 40px !important;
            }

            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-calendar {
                width: 100%;
                min-width: 100%;
              }

              #routine-grid-${index} .rbc-time-view {
                width: 100%;
                min-width: 100%;
              }

              #routine-grid-${index} .rbc-day-slot {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }

              #routine-grid-${index} .rbc-header {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }
            }

            @media (min-width: 1024px) {
              #routine-grid-${index} .rbc-day-slot {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }

              #routine-grid-${index} .rbc-header {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }
            }

            @media (min-width: 1280px) {
              #routine-grid-${index} .rbc-day-slot {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }

              #routine-grid-${index} .rbc-header {
                min-width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                width: calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
                flex: 0 0 calc((100% - 70px) / ${activeDayIndices.length || 6}) !important;
              }
            }

            /* Container scrolls both directions */
            #routine-grid-${index} {
              display: flex;
              flex-direction: column;
            }

            /* Make calendar time view scrollable */
            #routine-grid-${index} .rbc-calendar {
              display: flex;
              flex-direction: column;
              height: 100%;
              overflow: hidden !important;
            }

            #routine-grid-${index} .rbc-time-view {
              display: flex;
              flex-direction: column;
              flex: 1;
              overflow: hidden !important;
            }

            /* Header section - scrolls with content */
            #routine-grid-${index} .rbc-time-header {
              position: relative !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              min-height: auto;
              border: none !important;
            }

            #routine-grid-${index} .rbc-time-header-content {
              position: relative !important;
              overflow: visible !important;
              display: flex;
              min-width: max-content;
            }

            /* Content section - scrolls both ways */
            #routine-grid-${index} .rbc-time-content {
              position: relative !important;
              overflow: auto !important;
              flex: 1;
              border: none !important;
            }

            /* Time gutter and header gutter - no sticky, scroll with content */
            #routine-grid-${index} .rbc-time-header-gutter,
            #routine-grid-${index} .rbc-time-gutter {
              position: relative !important;
              left: auto !important;
              top: auto !important;
              z-index: auto !important;
              background: white;
              min-width: 60px !important;
              width: 60px !important;
              flex-shrink: 0 !important;
              border: none !important;
            }

            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-time-header-gutter,
              #routine-grid-${index} .rbc-time-gutter {
                min-width: 70px !important;
                width: 70px !important;
              }
            }

            /* Day headers - scroll with content */
            #routine-grid-${index} .rbc-header {
              padding: 8px 6px;
              font-size: 0.75rem;
              font-weight: 600;
              background: #f9fafb;
              border-bottom: 2px solid #e5e7eb !important;
              position: relative !important;
              overflow: visible !important;
              border: none !important;
            }

            /* Responsive font sizes */
            #routine-grid-${index} .rbc-calendar {
              font-size: 0.75rem;
            }
            
            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-calendar {
                font-size: 0.7rem;
              }
            }

            @media (min-width: 1024px) {
              #routine-grid-${index} .rbc-calendar {
                font-size: 0.65rem;
              }
            }

            @media (min-width: 1280px) {
              #routine-grid-${index} .rbc-calendar {
                font-size: 0.6rem;
              }
            }

            #routine-grid-${index} .rbc-event {
              padding: 6px 8px;
              font-size: 0.7rem;
            }

            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-event {
                padding: 4px 6px;
                font-size: 0.65rem;
              }
            }

            @media (min-width: 1024px) {
              #routine-grid-${index} .rbc-event {
                padding: 3px 5px;
                font-size: 0.6rem;
              }
            }

            @media (min-width: 1280px) {
              #routine-grid-${index} .rbc-event {
                padding: 2px 4px;
                font-size: 0.55rem;
              }
            }

            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-header {
                padding: 6px 4px;
                font-size: 0.7rem;
              }
            }

            @media (min-width: 1024px) {
              #routine-grid-${index} .rbc-header {
                padding: 4px 3px;
                font-size: 0.65rem;
              }
            }

            @media (min-width: 1280px) {
              #routine-grid-${index} .rbc-header {
                padding: 3px 2px;
                font-size: 0.6rem;
              }
            }

            #routine-grid-${index} .rbc-label {
              font-size: 0.7rem;
              padding: 4px 6px;
              text-align: center !important;
              width: 100% !important;
            }

            @media (min-width: 640px) {
              #routine-grid-${index} .rbc-label {
                font-size: 0.65rem;
                padding: 2px 4px;
                text-align: center !important;
                width: 100% !important;
              }
            }

            @media (min-width: 1024px) {
              #routine-grid-${index} .rbc-label {
                font-size: 0.6rem;
                padding: 2px 3px;
                text-align: center !important;
                width: 100% !important;
              }
            }

            @media (min-width: 1280px) {
              #routine-grid-${index} .rbc-label {
                font-size: 0.55rem;
                padding: 1px 2px;
                text-align: center !important;
                width: 100% !important;
              }
            }

            /* Full height for time slots */
            #routine-grid-${index} .rbc-time-content {
              height: auto;
              min-height: 100%;
            }

            #routine-grid-${index} .rbc-timeslot-group {
              min-height: 60px;
            }
            

            #routine-grid-${index} * {
              border-color: transparent !important;
            }

            #routine-grid-${index} .rbc-time-header-content .rbc-header {
              display: none;
              border: none !important;
            }
            ${activeDayIndices.map(dayIdx => `
              #routine-grid-${index} .rbc-time-header-content .rbc-header:nth-child(${dayIdx + 1}) {
                display: block;
                border: none !important;
              }
            `).join('')}
            
            #routine-grid-${index} .rbc-time-content .rbc-day-slot {
              display: none;
              border: none !important;
            }
            ${activeDayIndices.map((dayIdx, idx) => `
              #routine-grid-${index} .rbc-time-content .rbc-day-slot:nth-child(${dayIdx + 2}) {
                display: block;
                border: none !important;
              }
            `).join('')}

            #routine-grid-${index} .rbc-time-content {
              border: none !important;
            }

            #routine-grid-${index} .rbc-time-slot,
            #routine-grid-${index} .rbc-time-slot * {
              border: none !important;
            }

            #routine-grid-${index} .rbc-timeslot-group {
              border: none !important;
            }

            #routine-grid-${index} .rbc-time-header-gutter {
              border: none !important;
              background: transparent !important;
              visibility: hidden !important;
              min-width: 0 !important;
              width: 0 !important;
            }

            #routine-grid-${index} .rbc-event-label {
              display: none !important;
            }
            }

            #routine-grid-${index} .rbc-header {
              border: none !important;
            }

            /* Time header scrolls with content - not fixed */
            #routine-grid-${index} .rbc-time-header {
              position: relative;
              overflow: visible;
              border: none !important;
            }

            #routine-grid-${index} .rbc-time-header-content {
              position: relative;
              overflow: visible;
            }

            #routine-grid-${index} .rbc-day-slot {
              border: none !important;
              min-width: 100%;
            }
          `}</style>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            defaultView="week"
            views={['week']}
            step={30}
            showMultiDayTimes
            date={new Date(2025, 0, 5)}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent
            }}
            toolbar={false}
            formats={{
              dayFormat: 'ddd',
              timeGutterFormat: 'h:mm A',
            }}
            min={timeRange.min}
            max={timeRange.max}
            onNavigate={() => {}}
          />
        </div>

        {/* Course Legend - Removed as requested */}
      </div>
    </div>
  )
}

export default GeneratedRoutineDesign