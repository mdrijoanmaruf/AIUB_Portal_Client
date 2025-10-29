'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiDownload, FiTrash2, FiBook, FiCalendar } from 'react-icons/fi'
import RoutineCard from './RoutineCard'
import RoutineSkeleton from '../skeletons/RoutineSkeleton'
import Swal from 'sweetalert2'
import html2canvas from 'html2canvas'

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
              console.log('Using cached course sections data')
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
      console.log('Fetching fresh course sections from server')
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
    
    // Debug logging
    console.log('Finding alternatives for:', courseTitle, currentSection)
    console.log('Current times:', currentTimes)
    console.log('Total sections available:', allSections.length)
    console.log('Alternatives found:', alternatives)
    
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
      const routineElement = document.getElementById('routine-download-area')
      if (!routineElement) {
        throw new Error('Routine element not found')
      }

      // Generate canvas from the routine element
      const canvas = await html2canvas(routineElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          // Ignore SVG elements that cause color parsing issues
          if (element.tagName === 'svg' || element.tagName === 'SVG') {
            return true
          }
          return element.classList?.contains('ignore-screenshot') || false
        },
        onclone: (clonedDoc) => {
          // Remove all SVG elements that might cause issues
          const svgs = clonedDoc.querySelectorAll('svg')
          svgs.forEach(svg => svg.remove())
          
          // Remove any problematic CSS that uses lab() or other unsupported color functions
          const styleSheets = clonedDoc.styleSheets
          for (let i = 0; i < styleSheets.length; i++) {
            try {
              const sheet = styleSheets[i] as CSSStyleSheet
              if (sheet.cssRules) {
                for (let j = sheet.cssRules.length - 1; j >= 0; j--) {
                  const rule = sheet.cssRules[j]
                  if (rule.cssText && (rule.cssText.includes('lab(') || rule.cssText.includes('oklch('))) {
                    sheet.deleteRule(j)
                  }
                }
              }
            } catch (e) {
              // Skip sheets that can't be accessed (CORS)
              continue
            }
          }
        }
      })

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `my-routine-${new Date().toISOString().split('T')[0]}.png`
          link.click()
          URL.revokeObjectURL(url)

          Swal.fire({
            title: 'Downloaded!',
            text: 'Your routine has been downloaded as an image.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: '#ffffff',
            color: '#1f2937',
          })
        }
        setIsDownloading(false)
      }, 'image/png')
    } catch (error) {
      console.error('Download error:', error)
      setIsDownloading(false)
      Swal.fire({
        title: 'Error',
        text: 'Failed to download routine. Please try again.',
        icon: 'error',
        background: '#ffffff',
        color: '#1f2937',
      })
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
          <div className="flex items-center gap-2">
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
        </div>

        {/* Routine Cards or Empty State */}
        {selectedSections.length > 0 ? (
          <>
            {/* Hidden Download Area - Better Design */}
            <div id="routine-download-area" style={{ position: 'absolute', left: '-9999px', width: '1200px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '40px',
                fontFamily: 'Arial, sans-serif'
              }}>
                {/* Courses Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '25px' 
                }}>
                  {selectedSections.map((section, index) => (
                    <div 
                      key={section._id}
                      style={{ 
                        background: 'white',
                        borderRadius: '15px',
                        padding: '25px',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                        border: '3px solid ' + ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][index % 5]
                      }}
                    >
                      {/* Course Header */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ 
                          fontSize: '20px', 
                          fontWeight: 'bold', 
                          color: '#2d3748',
                          marginBottom: '8px',
                          lineHeight: '1.3'
                        }}>
                          {section['Course Title']}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ 
                            color: ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][index % 5],
                            fontSize: '20px',
                            fontWeight: 'bold'
                          }}>
                            Section: {section.Section}
                          </div>
                          {getAlternativeSections(section['Course Title'], section.Section, section.Time).length > 0 && (
                            <div style={{ 
                              color: '#2b6cb0',
                              fontSize: '20px',
                              fontWeight: '600'
                            }}>
                              Alternative sections: {getAlternativeSections(section['Course Title'], section.Section, section.Time).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Class ID */}
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#718096',
                        marginBottom: '12px',
                        fontWeight: '500'
                      }}>
                        🆔 Class ID: <strong style={{ color: '#4a5568' }}>{section['Class ID']}</strong>
                      </div>

                      {/* Time Slots */}
                      <div style={{ 
                        background: '#f7fafc',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        {section.Time.map((timeSlot, idx) => (
                          <div 
                            key={idx}
                            style={{ 
                              background: 'white',
                              padding: '10px',
                              borderRadius: '8px',
                              marginBottom: idx < section.Time.length - 1 ? '8px' : '0',
                              border: '2px solid #e2e8f0',
                              fontSize: '13px'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              marginBottom: '5px'
                            }}>
                              <span style={{ 
                                color: '#667eea',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {timeSlot['Class Type']}
                              </span>
                              <span style={{ 
                                fontWeight: 'bold',
                                color: '#2d3748'
                              }}>
                                📅 {timeSlot.Day}
                              </span>
                            </div>
                            <div style={{ 
                              color: '#4a5568',
                              fontWeight: '600',
                              marginTop: '5px'
                            }}>
                              🕐 {timeSlot['Start Time']} - {timeSlot['End Time']}
                            </div>
                            <div style={{ 
                              color: '#718096',
                              fontSize: '12px',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              📍 {timeSlot['Class Name']}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visible Routine Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {selectedSections.map(section => (
                <RoutineCard
                  key={section._id}
                  section={section}
                  alternativeSections={getAlternativeSections(section['Course Title'], section.Section, section.Time)}
                  onRemove={handleRemoveSection}
                />
              ))}
            </div>
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
