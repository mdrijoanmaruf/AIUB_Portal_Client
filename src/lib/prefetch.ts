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
    console.log('🔍 Checking grade report cache status...')
    
    // Check if already cached in cacheManager
    const cachedData = cacheManager.getCache('gradeReportData')
    if (cachedData && cachedData.byCurriculum && cachedData.bySemester) {
      console.log('✅ Grade report already cached in cacheManager')
      console.log('   - Curriculum semesters:', cachedData.byCurriculum?.semesters?.length || 0)
      console.log('   - Semester semesters:', cachedData.bySemester?.semesters?.length || 0)
      return true
    }

    // Fallback: Check localStorage cache
    const localCachedData = localStorage.getItem('gradeReportData')
    const cacheTimestamp = localStorage.getItem('gradeReportTimestamp')
    
    if (localCachedData && cacheTimestamp) {
      const age = Date.now() - parseInt(cacheTimestamp)
      if (age < CACHE_DURATION) {
        console.log('✅ Grade report already cached in localStorage (age:', Math.round(age / 1000), 'seconds)')
        // Migrate to cacheManager
        try {
          const data = JSON.parse(localCachedData)
          if (data && data.byCurriculum && data.bySemester) {
            cacheManager.setCache('gradeReportData', data, {
              maxAge: CACHE_DURATION - age,
              onExpiry: () => {
                console.log('Grade report prefetch cache expired')
              }
            })
            console.log('✅ Migrated to cacheManager successfully')
            return true
          }
        } catch (e) {
          console.error('❌ Failed to migrate cache to cacheManager:', e)
        }
      } else {
        console.log('⚠️ LocalStorage cache expired (age:', Math.round(age / 1000), 'seconds)')
      }
    }

    console.log('🔄 Prefetching grade report data from server...')
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
        maxAge: CACHE_DURATION,
        onExpiry: () => {
          console.log('Grade report prefetch cache expired')
        }
      })

      // Also store in localStorage as backup
      localStorage.setItem('gradeReportData', JSON.stringify(result.data))
      localStorage.setItem('gradeReportTimestamp', Date.now().toString())
      
      console.log('✅ Grade report data prefetched and cached successfully')
      console.log('   - Curriculum Semesters:', result.data.byCurriculum?.semesters?.length || 0)
      console.log('   - Semester Data:', result.data.bySemester?.semesters?.length || 0)
      return true
    }

    console.warn('⚠️ Grade report fetch returned no data')
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
  emitPrefetchEvent('started')
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
  console.log('🔍 getCachedGradeReport: Attempting to retrieve cached data...')
  
  // First try cacheManager
  const cachedData = cacheManager.getCache('gradeReportData')
  if (cachedData && cachedData.byCurriculum && cachedData.bySemester) {
    console.log('📦 Retrieved grade report from cacheManager')
    console.log('   - Curriculum semesters:', cachedData.byCurriculum?.semesters?.length || 0)
    console.log('   - Semester semesters:', cachedData.bySemester?.semesters?.length || 0)
    return cachedData
  } else if (cachedData) {
    console.log('⚠️ CacheManager has data but structure is incomplete:', cachedData)
  } else {
    console.log('ℹ️ No data in cacheManager')
  }

  // Fallback to localStorage
  const localCachedData = localStorage.getItem('gradeReportData')
  const cacheTimestamp = localStorage.getItem('gradeReportTimestamp')
  
  if (localCachedData && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp)
    if (age < CACHE_DURATION) {
      console.log('📦 Retrieved grade report from localStorage (age:', Math.round(age / 1000), 'seconds)')
      try {
        const data = JSON.parse(localCachedData)
        if (data && data.byCurriculum && data.bySemester) {
          console.log('   - Curriculum semesters:', data.byCurriculum?.semesters?.length || 0)
          console.log('   - Semester semesters:', data.bySemester?.semesters?.length || 0)
          
          // Migrate to cacheManager for next time
          cacheManager.setCache('gradeReportData', data, {
            maxAge: CACHE_DURATION - age,
            onExpiry: () => {
              console.log('Grade report cache expired')
            }
          })
          console.log('✅ Migrated localStorage cache to cacheManager')
          return data
        } else {
          console.log('⚠️ LocalStorage data structure is incomplete:', data)
        }
      } catch (e) {
        console.error('❌ Failed to parse cached grade report:', e)
        return null
      }
    } else {
      console.log('⏰ LocalStorage cache expired (age:', Math.round(age / 1000), 'seconds, max:', CACHE_DURATION / 1000, 'seconds)')
    }
  } else {
    console.log('ℹ️ No data in localStorage')
  }
  
  console.log('❌ No cached grade report found anywhere')
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
