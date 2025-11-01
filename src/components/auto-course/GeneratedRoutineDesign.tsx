import React from 'react'
import { FiDownload } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
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

  // Generate time slots for the timetable grid (every 1 hour)
  const generateTimeSlots = () => {
    const slots: string[] = []
    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)

    for (let minutes = start; minutes <= end; minutes += 60) { // Changed from 30 to 60 minutes
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
      const ampm = hours >= 12 ? 'PM' : 'AM'
      slots.push(`${hour12}:${mins.toString().padStart(2, '0')} ${ampm}`)
    }

    return slots
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

        <div className="relative">
          {/* Time slots and grid */}
          <div className={`grid gap-1 min-h-[300px] border border-gray-300 rounded-lg overflow-hidden bg-gray-50`}
               style={{ gridTemplateColumns: `100px repeat(${selectedDays.length}, 1fr)` }}>
            {/* Header row with selected days */}
            <div className="bg-gray-100 border-b border-gray-300 p-1 text-center font-semibold text-gray-700 text-xs">
              Time
            </div>
            {selectedDays.map(day => (
              <div key={day} className="bg-gray-100 border-b border-gray-300 p-1 text-center font-semibold text-gray-700 text-xs">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Time rows */}
            {generateTimeSlots().map((timeSlot, timeIndex) => (
              <React.Fragment key={timeSlot}>
                {/* Time label */}
                <div className="bg-white border-r border-gray-300 p-1 text-center text-xs text-gray-600 font-medium min-h-16 flex items-center justify-center">
                  {timeSlot}
                </div>

                {/* Selected day columns */}
                {selectedDays.map(day => {
                  const slotStart = timeToMinutes(timeSlot)
                  const slotEnd = slotStart + 60

                  // Build groups based on the routine's selected sections for this specific day/slot.
                  const normalize = (name: string) => name.replace(/\s*\[[A-Z0-9]\]\s*$/i, '').trim().toUpperCase()

                  const groups = routine.sections
                    .map(section => {
                      const sectionTimeInfo = section.Time.find((t: any) => normalizeDay(t.Day) === normalizeDay(day))
                      if (!sectionTimeInfo) return null

                      // Only consider this section if it starts within the current slot (first slot of the class)
                      const classStart = timeToMinutes(sectionTimeInfo['Start Time'])
                      if (!(classStart >= slotStart && classStart < slotEnd)) return null

                      const normTitle = normalize(section['Course Title'])

                      const matchingSections = allSections.filter((sec: CourseSection) => {
                        const secTitle = normalize(sec['Course Title'])
                        if (secTitle !== normTitle && !secTitle.includes(normTitle) && !normTitle.includes(secTitle)) return false

                        // Apply status filter - only show sections with selected status
                        if (selectedStatuses.length > 0 && !selectedStatuses.includes(sec.Status)) return false

                        // Apply minimum seats filter
                        if (minSeats) {
                          const availableSeats = parseInt(sec.Capacity) - parseInt(sec.Count)
                          const minSeatsValue = minSeats === '30+' ? 30 : parseInt(minSeats)
                          if (availableSeats < minSeatsValue) return false
                        }

                        // Section must have EXACTLY one time entry on this specific day that overlaps with the selected section's time
                        // This prevents mixing sections from different days that happen to have the same time
                        const dayNorm = normalizeDay(day)
                        const selStart = timeToMinutes(sectionTimeInfo['Start Time'])
                        const selEnd = timeToMinutes(sectionTimeInfo['End Time'])

                        return sec.Time.some((t: any) => {
                          // Must match the exact day we're rendering
                          if (normalizeDay(t.Day) !== dayNorm) return false
                          
                          // Must overlap the time window of the selected section for this day
                          const sStart = timeToMinutes(t['Start Time'])
                          const sEnd = timeToMinutes(t['End Time'])
                          return sStart < selEnd && sEnd > selStart
                        })
                      })

                      return { courseTitle: section['Course Title'], matchingSections, timeInfo: sectionTimeInfo }
                    })
                    .filter((g): g is { courseTitle: string; matchingSections: CourseSection[]; timeInfo: any } => g !== null)

                  return (
                    <div
                      key={`${day}-${timeSlot}`}
                      className="bg-white border-r border-gray-200 p-0.5 min-h-16 relative"
                    >
                      {groups.map(({ courseTitle, matchingSections, timeInfo }) => {
                        if (!timeInfo) return null

                        const isFirstSlot = timeToMinutes(timeInfo['Start Time']) >= slotStart && timeToMinutes(timeInfo['Start Time']) < slotEnd
                        if (!isFirstSlot) return null

                        const duration = timeToMinutes(timeInfo['End Time']) - timeToMinutes(timeInfo['Start Time'])
                        const height = (duration / 60) * 64
                        const colorClass = courseColors.get(courseTitle) || 'bg-gray-100 border-gray-300 text-gray-900'

                        // Build section list with capacity for each section (Count/Capacity format)
                        const sectionListWithCapacity = matchingSections.map((s: CourseSection) => {
                          const count = parseInt(s.Count)
                          const capacity = parseInt(s.Capacity)
                          return `${s.Section} (${count}/${capacity})`
                        }).join(', ')

                        return (
                          <div
                            key={`${courseTitle}-${day}`}
                            className={`absolute left-0.5 right-0.5 ${colorClass} border rounded-md p-1 shadow-sm overflow-hidden`}
                            style={{
                              height: `${height - 4}px`,
                              zIndex: 10
                            }}
                          >
                            <div className="text-xs font-semibold truncate leading-tight">
                              {courseTitle}
                            </div>
                            <div className="text-xs leading-tight">
                              Sec: {sectionListWithCapacity || `${routine.sections.find(s => s['Course Title'] === courseTitle)?.Section}`}
                            </div>
                            <div className="text-xs opacity-75 leading-tight">
                              {timeInfo['Start Time']} - {timeInfo['End Time']}
                            </div>
                            <div className="text-xs opacity-75 leading-tight">
                              {timeInfo['Class Name']}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
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