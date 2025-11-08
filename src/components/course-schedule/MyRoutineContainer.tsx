'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiDownload, FiTrash2, FiBook, FiCalendar } from 'react-icons/fi'
import RoutineSkeleton from '../skeletons/RoutineSkeleton'
import Swal from 'sweetalert2'
import { toPng } from 'html-to-image'
import GeneratedRoutineDesign from '../auto-course/GeneratedRoutineDesign'

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

const MyRoutineContainer: React.FC = () => {
  const router = useRouter()
  const [selectedSections, setSelectedSections] = useState<CourseSection[]>([])
  const [allSections, setAllSections] = useState<CourseSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    // Load selected sections from localStorage
    const storedSections = localStorage.getItem('myRoutineSections')
    if (storedSections) {
      try {
        const parsed = JSON.parse(storedSections)
        if (Array.isArray(parsed)) {
          setSelectedSections(parsed)
        }
      } catch (error) {
        console.error('Error parsing stored sections:', error)
      }
    }
    
    // Fetch all sections for alternative sections
    fetchAllSections()
  }, [])

  const fetchAllSections = async () => {
    try {
      // Check if data is cached
      const cachedData = localStorage.getItem('allCourseSections')
      const cacheTimestamp = localStorage.getItem('allCourseSectionsTimestamp')
      
      if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp)
        // Cache for 30 minutes (1800000 ms)
        if (age < 1800000) {
          try {
            const parsedCache = JSON.parse(cachedData)
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              setAllSections(parsedCache)
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('Error parsing cached course data:', error)
          }
        }
      }

      // Fetch from server if no valid cache
      const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses')
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setAllSections(data.data)
        
        // Cache the data
        try {
          localStorage.setItem('allCourseSections', JSON.stringify(data.data))
          localStorage.setItem('allCourseSectionsTimestamp', Date.now().toString())
        } catch (error) {
          console.error('Error caching course sections:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching all sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get alternative sections for a course (same day and time only)
  const getAlternativeSections = (courseTitle: string, currentSection: string, currentTimes: CourseSection['Time']) => {
    const alternatives = allSections
      .filter(s => {
        // Must be same course but different section
        if (s['Course Title'] !== courseTitle || s.Section === currentSection) {
          return false
        }
        
        // Check if any time slot matches the current section's time slots
        const hasMatchingTime = s.Time.some(sTime => 
          currentTimes.some(cTime => 
            sTime.Day === cTime.Day && 
            sTime['Start Time'] === cTime['Start Time'] &&
            sTime['End Time'] === cTime['End Time']
          )
        )
        
        return hasMatchingTime
      })
      .map(s => s.Section)
    
    return alternatives
  }

  const handleRemoveSection = (sectionId: string) => {
    Swal.fire({
      title: 'Remove Section?',
      text: 'Are you sure you want to remove this section from your routine?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
      background: '#ffffff',
      color: '#1f2937',
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedSections = selectedSections.filter(s => s._id !== sectionId)
        setSelectedSections(updatedSections)
        localStorage.setItem('myRoutineSections', JSON.stringify(updatedSections))
        
        Swal.fire({
          title: 'Removed!',
          text: 'Section has been removed from your routine.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1f2937',
        })
      }
    })
  }

  const handleClearAll = () => {
    Swal.fire({
      title: 'Clear All Sections?',
      text: 'This will remove all sections from your routine. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all',
      background: '#ffffff',
      color: '#1f2937',
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedSections([])
        localStorage.setItem('myRoutineSections', JSON.stringify([]))
        
        Swal.fire({
          title: 'Cleared!',
          text: 'All sections have been removed.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1f2937',
        })
      }
    })
  }

  const handleDownloadRoutine = async () => {
    if (selectedSections.length === 0) {
      Swal.fire({
        title: 'No Sections Selected',
        text: 'Please select some course sections first.',
        icon: 'warning',
        background: '#ffffff',
        color: '#1f2937',
      })
      return
    }

    setIsDownloading(true)
    
    try {
      // Use the same grid element that's displayed to the user
      const source = document.getElementById('routine-grid-0')
      if (!source) {
        throw new Error('Routine grid element not found')
      }

      // Create an offscreen (invisible) clone so the user doesn't see layout changes
      const offscreenWrapper = document.createElement('div')
      offscreenWrapper.id = 'offscreen-routine-wrapper-my'
      offscreenWrapper.style.position = 'fixed'
      offscreenWrapper.style.left = '0'
      offscreenWrapper.style.top = '0'
      offscreenWrapper.style.opacity = '0'
      offscreenWrapper.style.pointerEvents = 'none'
      offscreenWrapper.style.zIndex = '-1'
      offscreenWrapper.style.background = '#ffffff'

      const clone = source.cloneNode(true) as HTMLElement
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
      link.download = `my-routine-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()

      Swal.fire({
        title: 'Downloaded!',
        text: 'Your routine has been downloaded as an image.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#1f2937',
      })
    } catch (error) {
      console.error('Download error:', error)
      Swal.fire({
        title: 'Error',
        text: 'Failed to download routine. Please try again.',
        icon: 'error',
        background: '#ffffff',
        color: '#1f2937',
      })
      // Ensure cleanup if something failed
      const existingWrapper = document.querySelector('#offscreen-routine-wrapper-my')
      if (existingWrapper) existingWrapper.parentElement?.removeChild(existingWrapper)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return <RoutineSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Image 
                  src="/aiub.svg" 
                  alt="AIUB Logo" 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div className="hidden md:block">
                <h2 className="text-lg font-bold text-blue-600">AIUB Portal</h2>
              </div>
            </div>

            {/* Right - Back Button */}
            <button
              onClick={() => router.push('/courses/routine')}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 rounded-lg shadow-sm"
            >
              <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline text-sm">Back to Sections</span>
              <span className="sm:hidden text-sm">Back</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              My Routine
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              {selectedSections.length} course{selectedSections.length !== 1 ? 's' : ''} in your routine
            </p>
          </div>
          {selectedSections.length > 0 && (
            <>
              <button
                onClick={handleDownloadRoutine}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors shadow-md"
              >
                <FiDownload className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">
                  {isDownloading ? 'Downloading...' : 'Download'}
                </span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
              >
                <FiTrash2 className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Clear All</span>
              </button>
            </>
          )}
        </div>

        {/* Routine Cards or Empty State */}
        {selectedSections.length > 0 ? (
          <>
            {/* Visible Routine Display */}
            <GeneratedRoutineDesign
              routine={{ sections: selectedSections, conflicts: 0 }}
              index={0}
              selectedCourses={Array.from(new Set(selectedSections.map(s => s['Course Title'])))}
              selectedDays={Array.from(new Set(selectedSections.flatMap(s => s.Time.map(t => t.Day))))}
              startTime="08:00"
              endTime="19:00"
              allSections={allSections}
              selectedStatuses={[]}
              minSeats=""
              onDownload={handleDownloadRoutine}
              onSave={() => {}}
            />
          </>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center">
            <FiCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Sections Selected</h2>
            <p className="text-gray-600 mb-6">Start building your routine by selecting course sections</p>
            <button
              onClick={() => router.push('/courses/routine')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
            >
              <FiBook className="h-5 w-5" />
              <span>Browse Sections</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyRoutineContainer
