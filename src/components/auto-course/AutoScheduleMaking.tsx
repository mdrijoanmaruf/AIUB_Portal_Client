import React from 'react'
import { FiCalendar } from 'react-icons/fi'
import { toPng } from 'html-to-image'
import GeneratedRoutineDesign from './GeneratedRoutineDesign'

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

interface AutoScheduleMakingProps {
  selectedCourses: string[]
  allSections: CourseSection[]
  startTime: string
  endTime: string
  selectedDays: string[]
  selectedStatuses: string[]
  minSeats: string
  maxGap: string
  isGenerating: boolean
  generatedRoutines: Routine[]
  setStartTime: (time: string) => void
  setEndTime: (time: string) => void
  setSelectedDays: (days: string[]) => void
  setSelectedStatuses: (statuses: string[]) => void
  setMinSeats: (seats: string) => void
  setMaxGap: (gap: string) => void
  generateRoutines: () => void
  DAYS: string[]
  generationSummary?: {
    totalPossible: number
    combinationsGenerated: number
    missingCourses: string[]
    perCourseCounts?: Record<string, number>
  } | null
}

const AutoScheduleMaking: React.FC<AutoScheduleMakingProps> = ({
  selectedCourses,
  allSections,
  startTime,
  endTime,
  selectedDays,
  selectedStatuses,
  minSeats,
  maxGap,
  isGenerating,
  generatedRoutines,
  setStartTime,
  setEndTime,
  setSelectedDays,
  setSelectedStatuses,
  setMinSeats,
  setMaxGap,
  generateRoutines,
  DAYS,
  generationSummary
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

  // Download routine as image
  const downloadRoutineImage = async (index: number) => {
    const source = document.getElementById(`routine-grid-${index}`)
    if (!source) return

    try {
      // Create an offscreen (invisible) clone so the user doesn't see layout changes
  const offscreenWrapper = document.createElement('div')
  offscreenWrapper.id = 'offscreen-routine-wrapper'
      offscreenWrapper.style.position = 'fixed'
      offscreenWrapper.style.left = '0'
      offscreenWrapper.style.top = '0'
      offscreenWrapper.style.opacity = '0'
      offscreenWrapper.style.pointerEvents = 'none'
      offscreenWrapper.style.zIndex = '-1'
      offscreenWrapper.style.background = '#ffffff'

      const clone = source.cloneNode(true) as HTMLElement
      // Enable download-specific compact layout only on the clone
      clone.setAttribute('data-downloading', 'true')

      offscreenWrapper.appendChild(clone)
      document.body.appendChild(offscreenWrapper)

      // Adjust widths inside the clone to ensure consistent export sizing
      const daySlots = clone.querySelectorAll('.rbc-day-slot')
      const headers = clone.querySelectorAll('.rbc-header')
      const timeView = clone.querySelector('.rbc-time-view') as HTMLElement
      const calendar = clone.querySelector('.rbc-calendar') as HTMLElement

      const forceSizes = (elements: NodeListOf<Element>) => {
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.setProperty('min-width', '300px', '')
          htmlEl.style.setProperty('width', '300px', '')
          htmlEl.style.setProperty('flex', '0 0 300px', '')
        })
      }

      forceSizes(daySlots)
      forceSizes(headers)

      if (timeView) {
        timeView.style.setProperty('width', 'max-content', '')
        timeView.style.setProperty('min-width', '100%', '')
      }
      if (calendar) {
        calendar.style.setProperty('width', 'max-content', '')
      }

      clone.style.setProperty('overflow', 'visible', '')
      clone.style.setProperty('width', 'max-content', '')

      // Allow layout to settle
      await new Promise(resolve => setTimeout(resolve, 150))

      const dataUrl = await toPng(clone, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      })

      // Cleanup offscreen clone
      document.body.removeChild(offscreenWrapper)

      const link = document.createElement('a')
      link.download = `routine-option-${index + 1}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error downloading routine:', error)
      // Ensure cleanup if something failed
      const existingWrapper = document.querySelector('#offscreen-routine-wrapper')
      if (existingWrapper) existingWrapper.parentElement?.removeChild(existingWrapper)
    }
  }

  const saveRoutine = (routine: Routine) => {
    localStorage.setItem('myRoutineSections', JSON.stringify(routine.sections))
    // Navigate to my-routine page - this will be handled by the parent component
    window.location.href = '/courses/my-routine'
  }

  return (
    <>
      {/* Generated Routines */}
      {isGenerating && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-purple-600 mx-auto mb-3 sm:mb-4"></div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            Generating Routines...
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Please wait while we find the best schedules for you
          </p>
        </div>
      )}

      {!isGenerating && generatedRoutines.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2 text-gray-800 flex-wrap">
              <FiCalendar className="text-green-600 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>All Possible Complete Routines ({generatedRoutines.length})</span>
              {generatedRoutines.length >= 50 && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  Showing first 50
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {generatedRoutines.map((routine, idx) => (
              <GeneratedRoutineDesign
                key={idx}
                routine={routine}
                index={idx}
                selectedCourses={selectedCourses}
                selectedDays={selectedDays}
                startTime={startTime}
                endTime={endTime}
                allSections={allSections}
                selectedStatuses={selectedStatuses}
                minSeats={minSeats}
                onDownload={downloadRoutineImage}
                onSave={saveRoutine}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Routines Found - provide clearer explanation when combinations existed */}
      {!isGenerating && generatedRoutines.length === 0 && allSections.length > 0 && generationSummary && generationSummary.totalPossible > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm text-center">
          <FiCalendar className="h-12 w-12 sm:h-16 sm:w-16 text-orange-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            No Complete Routines Could Be Generated
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            We estimated approximately <strong>{generationSummary.totalPossible.toLocaleString()}</strong> possible combinations, but none of the complete schedules passed your conflict and gap rules.
          </p>
          <div className="text-left max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 space-y-2">
            <p className="font-medium">Per-course available section counts (after applying your filters):</p>
            <ul className="list-disc ml-4 sm:ml-6 space-y-1">
              {generationSummary.perCourseCounts && Object.entries(generationSummary.perCourseCounts).map(([course, count]) => (
                <li key={course}>{course}: {count}</li>
              ))}
            </ul>
            <p className="mt-3">Try relaxing your filters (wider time range, more days selected, increase maximum gap, or lower minimum seats) to allow complete routines.</p>
          </div>
          <button
            onClick={() => {
              setStartTime('08:00')
              setEndTime('19:00')
              setSelectedDays(DAYS)
              setSelectedStatuses([])
              setMinSeats('')
              setMaxGap('')
            }}
            className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            Reset Filters to Default
          </button>
        </div>
      )}

      {/* Generic No Routines Found (no sections loaded or no possible combinations) */}
      {!isGenerating && generatedRoutines.length === 0 && allSections.length > 0 && (!generationSummary || generationSummary.totalPossible === 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm text-center">
          <FiCalendar className="h-12 w-12 sm:h-16 sm:w-16 text-orange-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            No Routines Found
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">
            We couldn't generate any complete routines with your current preferences. This might be because:
          </p>
          <ul className="text-left max-w-md mx-auto text-xs sm:text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">•</span>
              <span>No available sections for all selected courses with your current filters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">•</span>
              <span>The time range is too narrow - try expanding your start/end times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">•</span>
              <span>Too few days selected - try selecting more days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">•</span>
              <span>The gap limit is too restrictive - try increasing the maximum gap between classes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5 shrink-0">•</span>
              <span>Section availability conflicts - try adjusting your preferences</span>
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
            className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
          >
            Reset Filters to Default
          </button>
        </div>
      )}

      {/* Initial state - before generation */}
      {!isGenerating && generatedRoutines.length === 0 && allSections.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm text-center">
          <FiCalendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
            Ready to Generate Routines
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm">
            Set your preferences and click "Generate Routines" to see possible schedules
          </p>
        </div>
      )}
    </>
  )
}

export default AutoScheduleMaking