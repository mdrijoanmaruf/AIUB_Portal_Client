/**
 * Data Prefetching Utility
 * Automatically prefetch and cache API data for better UX
 */

import { cacheManager } from './cacheManager'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'
const CACHE_DURATION = 20 * 60 * 1000 // 20 minutes

interface PrefetchResult {
  success: boolean
  cached: string[]
  failed: string[]
}

// Event emitter for prefetch status
type PrefetchEventListener = (status: 'started' | 'completed' | 'failed', data?: any) => void
const prefetchListeners: PrefetchEventListener[] = []

export function onPrefetchStatusChange(listener: PrefetchEventListener) {
  prefetchListeners.push(listener)
  return () => {
    const index = prefetchListeners.indexOf(listener)
    if (index > -1) {
      prefetchListeners.splice(index, 1)
    }
  }
}

function emitPrefetchEvent(status: 'started' | 'completed' | 'failed', data?: any) {
  prefetchListeners.forEach(listener => listener(status, data))
}

/**
 * Prefetch grade report data (curriculum and semester)
 */
async function prefetchGradeReport(authToken: string): Promise<boolean> {
  try {
    // Check if already cached in cacheManager
    const cachedData = cacheManager.getCache('gradeReportData')
    if (cachedData && cachedData.byCurriculum && cachedData.bySemester) {
      return true
    }

    // Fallback: Check localStorage cache
    const localCachedData = localStorage.getItem('gradeReportData')
    const cacheTimestamp = localStorage.getItem('gradeReportTimestamp')
    
    if (localCachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      if (age < CACHE_DURATION) {
        // Migrate to cacheManager
        try {
          const data = JSON.parse(localCachedData)
          if (data && data.byCurriculum && data.bySemester) {
            cacheManager.setCache('gradeReportData', data, {
              maxAge: CACHE_DURATION - age
            })
            return true
          }
        } catch (e) {
          console.error('❌ Failed to migrate cache to cacheManager:', e)
        }
      }
    }

    const response = await fetch(`${API_BASE}/grade-report/all`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch grade report: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data && result.data.byCurriculum && result.data.bySemester) {
      // Store in cacheManager (primary)
      cacheManager.setCache('gradeReportData', result.data, {
        maxAge: CACHE_DURATION
      })

      // Also store in localStorage as backup
      localStorage.setItem('gradeReportData', JSON.stringify(result.data))
      localStorage.setItem('gradeReportTimestamp', Date.now().toString())
      
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
        return true
      }
    }

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
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch course names:', error)
    return false
  }
}

/**
 * Prefetch registration data
 */
async function prefetchRegistration(authToken: string): Promise<boolean> {
  try {
    // Check if already cached in cacheManager
    const cachedData = cacheManager.getCache('registrationData')
    if (cachedData && cachedData.semesters && cachedData.courses) {
      return true
    }

    const response = await fetch(`${API_BASE}/registration/data`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch registration: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data) {
      // Store in cacheManager (primary)
      cacheManager.setCache('registrationData', result.data, {
        maxAge: CACHE_DURATION
      })

      // Also store in localStorage as backup
      localStorage.setItem('registrationData', JSON.stringify(result.data))
      localStorage.setItem('registrationDataTimestamp', Date.now().toString())
      
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch registration:', error)
    return false
  }
}

/**
 * Prefetch finance data
 */
async function prefetchFinance(authToken: string): Promise<boolean> {
  try {
    // Check if already cached in cacheManager
    const cachedData = cacheManager.getCache('financeData')
    if (cachedData) {
      return true
    }

    const response = await fetch(`${API_BASE}/finance/data`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch finance: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data) {
      // Store in cacheManager (primary)
      cacheManager.setCache('financeData', result.data, {
        maxAge: CACHE_DURATION
      })

      // Also store in localStorage as backup
      localStorage.setItem('financeData', JSON.stringify(result.data))
      localStorage.setItem('financeDataTimestamp', Date.now().toString())
      
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Failed to prefetch finance:', error)
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
        return true
      }
    }

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
  emitPrefetchEvent('started')
  const startTime = Date.now()

  const cached: string[] = []
  const failed: string[] = []

  // Run all prefetch operations in parallel for better performance
  const results = await Promise.allSettled([
    prefetchGradeReport(authToken),
    prefetchRegistration(authToken),
    prefetchFinance(authToken),
    prefetchCourseNames(),
    prefetchAllCourseSections()
  ])

  // Process results
  const [
    gradeReportResult, 
    registrationResult, 
    financeResult, 
    courseNamesResult, 
    courseSectionsResult
  ] = results

  if (gradeReportResult.status === 'fulfilled' && gradeReportResult.value) {
    cached.push('Grade Report')
  } else {
    failed.push('Grade Report')
  }

  if (registrationResult.status === 'fulfilled' && registrationResult.value) {
    cached.push('Registration')
  } else {
    failed.push('Registration')
  }

  if (financeResult.status === 'fulfilled' && financeResult.value) {
    cached.push('Finance')
  } else {
    failed.push('Finance')
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
  console.log(`✅ Prefetch completed in ${duration}ms - Cached: ${cached.length}, Failed: ${failed.length}`)

  const result = {
    success: failed.length === 0,
    cached,
    failed
  }

  emitPrefetchEvent(result.success ? 'completed' : 'failed', result)

  return result
}

/**
 * Get cached grade report data
 * Tries cacheManager first, then falls back to localStorage
 */
export function getCachedGradeReport() {
  // First try cacheManager
  const cachedData = cacheManager.getCache('gradeReportData')
  if (cachedData && cachedData.byCurriculum && cachedData.bySemester) {
    return cachedData
  }

  // Fallback to localStorage
  const localCachedData = localStorage.getItem('gradeReportData')
  const cacheTimestamp = localStorage.getItem('gradeReportTimestamp')
  
  if (localCachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      try {
        const data = JSON.parse(localCachedData)
        if (data && data.byCurriculum && data.bySemester) {
          // Migrate to cacheManager for next time
          cacheManager.setCache('gradeReportData', data, {
            maxAge: CACHE_DURATION - age
          })
          return data
        }
      } catch (e) {
        console.error('Failed to parse cached grade report:', e)
        return null
      }
    }
  }
  
  return null
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

/**
 * Get cached registration data
 */
export function getCachedRegistration() {
  // First try cacheManager
  const cachedData = cacheManager.getCache('registrationData')
  if (cachedData) {
    return cachedData
  }

  // Fallback to localStorage
  const localCachedData = localStorage.getItem('registrationData')
  const cacheTimestamp = localStorage.getItem('registrationDataTimestamp')
  
  if (localCachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      try {
        const data = JSON.parse(localCachedData)
        if (data) {
          // Migrate to cacheManager for next time
          cacheManager.setCache('registrationData', data, {
            maxAge: CACHE_DURATION - age
          })
          return data
        }
      } catch (e) {
        console.error('Failed to parse cached registration:', e)
        return null
      }
    }
  }
  
  return null
}

/**
 * Get cached finance data
 */
export function getCachedFinance() {
  // First try cacheManager
  const cachedData = cacheManager.getCache('financeData')
  if (cachedData) {
    return cachedData
  }

  // Fallback to localStorage
  const localCachedData = localStorage.getItem('financeData')
  const cacheTimestamp = localStorage.getItem('financeDataTimestamp')
  
  if (localCachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      try {
        const data = JSON.parse(localCachedData)
        if (data) {
          // Migrate to cacheManager for next time
          cacheManager.setCache('financeData', data, {
            maxAge: CACHE_DURATION - age
          })
          return data
        }
      } catch (e) {
        console.error('Failed to parse cached finance:', e)
        return null
      }
    }
  }
  
  return null
}
