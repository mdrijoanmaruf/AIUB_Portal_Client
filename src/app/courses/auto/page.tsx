'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import AutoRoutineDataManager from '@/components/auto-course/AutoRoutineDataManager'
import AutoRoutineLogic from '@/components/auto-course/AutoRoutineLogic'
import SelectedCourseAndFilter from '@/components/auto-course/SelectedCourseAndFilter'
import AutoCourseHeader from '@/components/auto-course/AutoCourseHeader'
import AutoCourseNavbar from '@/components/auto-course/AutoCourseNavbar'
import AutoScheduleMaking from '@/components/auto-course/AutoScheduleMaking'

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

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']

// Generate time options from 8:00 AM to 7:00 PM with 1-hour intervals
const generateTimeOptions = () => {
  const options = []
  const startHour = 8 // 8:00 AM
  const endHour = 19 // 7:00 PM (19:00 in 24-hour)

  for (let hour = startHour; hour <= endHour; hour++) {
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const timeLabel = `${hour12}:00 ${ampm}`
    const timeValue = `${hour.toString().padStart(2, '0')}:00`

    options.push({ label: timeLabel, value: timeValue })
  }

  return options
}

const TIME_OPTIONS = generateTimeOptions()

const MIN_SEAT_OPTIONS = [
  { label: 'No minimum', value: '' },
  { label: '5 seats', value: '5' },
  { label: '10 seats', value: '10' },
  { label: '15 seats', value: '15' },
  { label: '20 seats', value: '20' },
  { label: '25 seats', value: '25' },
  { label: '30+ seats', value: '30+' }
]

const MAX_GAP_OPTIONS = [
  { label: 'No limit', value: '' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '2.5 hours', value: '150' },
  { label: '3 hours', value: '180' }
]

const AutoRoutineGenerate = () => {
  const router = useRouter()

  return (
    <AutoRoutineDataManager>
      {(dataProps) => (
        <AutoRoutineLogic
          allSections={dataProps.allSections}
          selectedCourses={dataProps.selectedCourses}
          startTime={dataProps.startTime}
          endTime={dataProps.endTime}
          selectedDays={dataProps.selectedDays}
          selectedStatuses={dataProps.selectedStatuses}
          minSeats={dataProps.minSeats}
          maxGap={dataProps.maxGap}
          setIsGenerating={dataProps.setIsGenerating}
          setGeneratedRoutines={dataProps.setGeneratedRoutines}
          setGenerationSummary={dataProps.setGenerationSummary}
        >
          {(logicProps) => (
            <div className="min-h-screen bg-gray-50 text-gray-900">
              {/* Navbar */}
              <AutoCourseNavbar onBackClick={() => router.push('/courses/routine')} />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <AutoCourseHeader />

                {/* Selected Courses and Filters */}
                <SelectedCourseAndFilter
                  selectedCourses={dataProps.selectedCourses}
                  allSections={dataProps.allSections}
                  isLoadingSections={dataProps.isLoadingSections}
                  startTime={dataProps.startTime}
                  setStartTime={dataProps.setStartTime}
                  endTime={dataProps.endTime}
                  setEndTime={dataProps.setEndTime}
                  selectedDays={dataProps.selectedDays}
                  toggleDay={dataProps.toggleDay}
                  selectedStatuses={dataProps.selectedStatuses}
                  toggleStatus={dataProps.toggleStatus}
                  getAvailableStatuses={dataProps.getAvailableStatuses}
                  minSeats={dataProps.minSeats}
                  setMinSeats={dataProps.setMinSeats}
                  maxGap={dataProps.maxGap}
                  setMaxGap={dataProps.setMaxGap}
                  generateRoutines={logicProps.generateRoutines}
                  isGenerating={dataProps.isGenerating}
                  TIME_OPTIONS={TIME_OPTIONS}
                  DAYS={DAYS}
                  MIN_SEAT_OPTIONS={MIN_SEAT_OPTIONS}
                  MAX_GAP_OPTIONS={MAX_GAP_OPTIONS}
                />

                {/* Generated Routines */}
                <AutoScheduleMaking
                  selectedCourses={dataProps.selectedCourses}
                  allSections={dataProps.allSections}
                  startTime={dataProps.startTime}
                  endTime={dataProps.endTime}
                  selectedDays={dataProps.selectedDays}
                  selectedStatuses={dataProps.selectedStatuses}
                  minSeats={dataProps.minSeats}
                  maxGap={dataProps.maxGap}
                  isGenerating={dataProps.isGenerating}
                  generatedRoutines={dataProps.generatedRoutines}
                  generationSummary={dataProps.generationSummary}
                  setStartTime={dataProps.setStartTime}
                  setEndTime={dataProps.setEndTime}
                  setSelectedDays={dataProps.setSelectedDays}
                  setSelectedStatuses={dataProps.setSelectedStatuses}
                  setMinSeats={dataProps.setMinSeats}
                  setMaxGap={dataProps.setMaxGap}
                  generateRoutines={logicProps.generateRoutines}
                  DAYS={DAYS}
                />
              </div>
            </div>
          )}
        </AutoRoutineLogic>
      )}
    </AutoRoutineDataManager>
  )
}

export default AutoRoutineGenerate