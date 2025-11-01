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

          return sec.Time.some((t: any) => {
            if (normalizeDay(t.Day) !== dayNorm) return false
            const sStart = timeToMinutes(t['Start Time'])
            const sEnd = timeToMinutes(t['End Time'])
            return sStart < selEnd && sEnd > selStart
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

  // Custom event style getter
  const eventStyleGetter = (event: any) => {
    const colorClass = courseColors.get(event.resource.courseTitle)
    const colorMap: Record<string, { backgroundColor: string; borderColor: string }> = {
      'bg-blue-100 border-blue-300 text-blue-900': { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
      'bg-purple-100 border-purple-300 text-purple-900': { backgroundColor: '#E9D5FF', borderColor: '#C084FC' },
      'bg-green-100 border-green-300 text-green-900': { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7' },
      'bg-orange-100 border-orange-300 text-orange-900': { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' },
      'bg-pink-100 border-pink-300 text-pink-900': { backgroundColor: '#FCE7F3', borderColor: '#F9A8D4' },
      'bg-cyan-100 border-cyan-300 text-cyan-900': { backgroundColor: '#CFFAFE', borderColor: '#67E8F9' },
      'bg-indigo-100 border-indigo-300 text-indigo-900': { backgroundColor: '#E0E7FF', borderColor: '#A5B4FC' },
      'bg-teal-100 border-teal-300 text-teal-900': { backgroundColor: '#CCFBF1', borderColor: '#5EEAD4' },
    }

    const colors = colorMap[colorClass || ''] || { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }

    return {
      style: {
        backgroundColor: colors.backgroundColor,
        borderLeft: `4px solid ${colors.borderColor}`,
        color: '#1F2937',
        borderRadius: '4px',
        opacity: 1,
        display: 'block',
        fontSize: '0.75rem',
        padding: '2px 4px'
      }
    }
  }

  // Custom event component
  const CustomEvent = ({ event }: any) => (
    <div className="text-xs">
      <div className="font-semibold truncate">{event.title}</div>
      <div className="truncate">Sec: {event.resource.section}</div>
      <div className="opacity-75 truncate">{event.resource.className}</div>
    </div>
  )

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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">
            Routine Option {index + 1}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Complete routine with all {selectedCourses.length} courses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onDownload(index)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <FiDownload className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={() => onSave(routine)}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
          >
            Use This Routine
          </button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div
        id={`routine-${index}`}
        className="p-6 bg-white"
      >
        <div className="mb-4">
          <h4 className="text-lg font-bold text-gray-800 mb-1">Weekly Schedule</h4>
          <p className="text-sm text-gray-600">Routine Option {index + 1}</p>
        </div>

        <div 
          id={`routine-grid-${index}`}
          className="relative routine-calendar-container"
          style={{ height: '600px' }}
          data-active-days={activeDayIndices.join(',')}
        >
          <style>{`
            #routine-grid-${index} .rbc-time-header-content .rbc-header {
              display: none;
            }
            ${activeDayIndices.map(dayIdx => `
              #routine-grid-${index} .rbc-time-header-content .rbc-header:nth-child(${dayIdx + 1}) {
                display: block;
              }
            `).join('')}
            
            #routine-grid-${index} .rbc-time-content .rbc-day-slot {
              display: none;
            }
            ${activeDayIndices.map((dayIdx, idx) => `
              #routine-grid-${index} .rbc-time-content .rbc-day-slot:nth-child(${dayIdx + 2}) {
                display: block;
                ${idx === 0 ? 'border-left: 1px solid #E5E7EB;' : ''}
              }
            `).join('')}
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

        {/* Course Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Course Legend</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {Array.from(courseColors.entries()).map(([courseTitle, colorClass]) => {
              const section = routine.sections.find(s => s['Course Title'] === courseTitle)
              return (
                <div key={courseTitle} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${colorClass} border`}></div>
                  <div className="text-xs flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{courseTitle}</div>
                    {section && (
                      <div className="text-gray-600 truncate">
                        Sec {section.Section} • {section.Status}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratedRoutineDesign