'use client'

import React, { useState, useEffect } from 'react'
import CourseSelectionContainer from './CourseSelectionContainer'
import CurriculumProgress from './CurriculumProgress'

interface CourseScheduleWrapperProps {
  courseNames: string[]
}

const CourseScheduleWrapper: React.FC<CourseScheduleWrapperProps> = ({ courseNames }) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  // Load selected courses from localStorage on mount
  useEffect(() => {
    const storedCourses = localStorage.getItem('selectedCourses')
    if (storedCourses) {
      try {
        const parsedCourses = JSON.parse(storedCourses)
        if (Array.isArray(parsedCourses)) {
          setSelectedCourses(parsedCourses)
        }
      } catch (error) {
        console.error('Error parsing stored courses:', error)
        localStorage.removeItem('selectedCourses')
      }
    }
  }, [])

  // Save to localStorage whenever selectedCourses changes
  useEffect(() => {
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses))
  }, [selectedCourses])

  const handleCourseSelection = (courseName: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseName)
        ? prev.filter(c => c !== courseName)
        : [...prev, courseName]
    )
  }

  return (
    <>
      {/* Course Selection Section */}
      <CourseSelectionContainer
        courseNames={courseNames}
        selectedCourses={selectedCourses}
        onCourseSelect={handleCourseSelection}
      />

      {/* Curriculum Progress Section */}
      <CurriculumProgress 
        onCourseSelect={handleCourseSelection} 
        selectedCourses={selectedCourses}
      />
    </>
  )
}

export default CourseScheduleWrapper
