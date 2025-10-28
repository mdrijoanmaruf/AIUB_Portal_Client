'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiDownload, FiTrash2, FiBook, FiCalendar } from 'react-icons/fi'
import RoutineCard from './RoutineCard'
import RoutineSkeleton from '../skeletons/RoutineSkeleton'
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

const MyRoutineContainer: React.FC = () => {
  const router = useRouter()
  const [selectedSections, setSelectedSections] = useState<CourseSection[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
    setIsLoading(false)
  }, [])

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

  const handleDownloadRoutine = () => {
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

    const routineData = selectedSections.map(section => ({
      Course: section['Course Title'],
      Section: section.Section,
      'Class ID': section['Class ID'],
      Status: section.Status,
      Capacity: `${section.Count}/${section.Capacity}`,
      Schedule: section.Time.map(t => 
        `${t['Class Type']} - ${t.Day} ${t['Start Time']}-${t['End Time']}`
      ).join(' | ')
    }))

    const dataStr = JSON.stringify(routineData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `my-routine-${new Date().toISOString().split('T')[0]}.json`
    link.click()

    Swal.fire({
      title: 'Downloaded!',
      text: 'Your routine has been downloaded successfully.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#ffffff',
      color: '#1f2937',
    })
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
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                >
                  <FiDownload className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Download</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {selectedSections.map(section => (
              <RoutineCard
                key={section._id}
                section={section}
                onRemove={handleRemoveSection}
              />
            ))}
          </div>
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
