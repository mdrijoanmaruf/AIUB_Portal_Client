/**
 * Data Prefetching Utility
 * Automatically prefetch and cache API data for better UX
 */

import { cacheManager } from './cacheManager'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface PrefetchResult {
  success: boolean
  cached: string[]
  failed: string[]
}

/**
 * Prefetch grade report data (curriculum and semester)
 */
async function prefetchGradeReport(authToken: string): Promise<boolean> {
  try {
    // Check if already cached and still valid
    const cachedData = localStorage.getItem('gradeReportData')
    const cacheTimestamp = localStorage.getItem('gradeReportTimestamp')
    
    if (cachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      if (age < CACHE_DURATION) {
        console.log('✅ Grade report already cached (age:', Math.round(age / 1000), 'seconds)')
        return true
      }
    }

    console.log('🔄 Prefetching grade report data...')
    const response = await fetch(`${API_BASE}/grade-report/all`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch grade report')
    }

    const result = await response.json()

    if (result.success) {
      // Cache the data
      localStorage.setItem('gradeReportData', JSON.stringify(result.data))
      localStorage.setItem('gradeReportTimestamp', Date.now().toString())
      console.log('✅ Grade report data prefetched and cached')
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch grade report:', error)
    return false
  }
}

/**
 * Prefetch course names for course selection page
 */
async function prefetchCourseNames(): Promise<boolean> {
  try {
    // Check if already cached and still valid
    const cachedData = localStorage.getItem('courseNames')
    const cacheTimestamp = localStorage.getItem('courseNamesTimestamp')
    
    if (cachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      if (age < CACHE_DURATION) {
        console.log('✅ Course names already cached (age:', Math.round(age / 1000), 'seconds)')
        return true
      }
    }

    console.log('🔄 Prefetching course names...')
    const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses', {
      cache: 'force-cache'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch courses')
    }

    const result = await response.json()
    
    if (result.success && Array.isArray(result.data)) {
      const courseNames = result.data
        .map((course: any) => course['Course Title'])
        .filter((name: any): name is string => typeof name === 'string')
      const uniqueNames = [...new Set(courseNames)]
      
      // Cache the data
      localStorage.setItem('courseNames', JSON.stringify(uniqueNames.sort()))
      localStorage.setItem('courseNamesTimestamp', Date.now().toString())
      console.log('✅ Course names prefetched and cached')
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch course names:', error)
    return false
  }
}

/**
 * Prefetch all course sections data
 */
async function prefetchAllCourseSections(): Promise<boolean> {
  try {
    // Check if already cached and still valid
    const cachedData = localStorage.getItem('allCourseSections')
    const cacheTimestamp = localStorage.getItem('allCourseSectionsTimestamp')
    
    if (cachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      if (age < CACHE_DURATION) {
        console.log('✅ All course sections already cached (age:', Math.round(age / 1000), 'seconds)')
        return true
      }
    }

    console.log('🔄 Prefetching all course sections...')
    const response = await fetch('https://aiub-course-kappa.vercel.app/api/courses', {
      cache: 'force-cache'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch course sections')
    }

    const result = await response.json()
    
    if (result.success && Array.isArray(result.data)) {
      // Cache the data
      localStorage.setItem('allCourseSections', JSON.stringify(result.data))
      localStorage.setItem('allCourseSectionsTimestamp', Date.now().toString())
      console.log('✅ All course sections prefetched and cached')
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch course sections:', error)
    return false
  }
}

/**
 * Main prefetch function - prefetch all data in the background
 * This runs after successful login to prepare data for all pages
 */
export async function prefetchAllData(authToken: string): Promise<PrefetchResult> {
  console.log('🚀 Starting background data prefetch...')
  const startTime = Date.now()

  const cached: string[] = []
  const failed: string[] = []

  // Run all prefetch operations in parallel for better performance
  const results = await Promise.allSettled([
    prefetchGradeReport(authToken),
    prefetchCourseNames(),
    prefetchAllCourseSections()
  ])

  // Process results
  const [gradeReportResult, courseNamesResult, courseSectionsResult] = results

  if (gradeReportResult.status === 'fulfilled' && gradeReportResult.value) {
    cached.push('Grade Report')
  } else {
    failed.push('Grade Report')
  }

  if (courseNamesResult.status === 'fulfilled' && courseNamesResult.value) {
    cached.push('Course Names')
  } else {
    failed.push('Course Names')
  }

  if (courseSectionsResult.status === 'fulfilled' && courseSectionsResult.value) {
    cached.push('Course Sections')
  } else {
    failed.push('Course Sections')
  }

  const duration = Date.now() - startTime
  console.log(`✨ Prefetch complete in ${duration}ms - Cached: ${cached.length}, Failed: ${failed.length}`)

  return {
    success: failed.length === 0,
    cached,
    failed
  }
}

/**
 * Get cached grade report data
 */
export function getCachedGradeReport() {
  return cacheManager.getCache('gradeReportData')
}

/**
 * Get cached course names
 */
export function getCachedCourseNames() {
  const cachedData = localStorage.getItem('courseNames')
  const cacheTimestamp = localStorage.getItem('courseNamesTimestamp')
  
  if (cachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      return JSON.parse(cachedData)
    }
  }
  
  return null
}

/**
 * Get cached course sections
 */
export function getCachedCourseSections() {
  const cachedData = localStorage.getItem('allCourseSections')
  const cacheTimestamp = localStorage.getItem('allCourseSectionsTimestamp')
  
  if (cachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      return JSON.parse(cachedData)
    }
  }
  
  return null
}
