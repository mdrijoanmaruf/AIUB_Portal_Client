// Course data caching utilities

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export const CACHE_KEYS = {
  ALL_SECTIONS: 'allCourseSections',
  ALL_SECTIONS_TIMESTAMP: 'allCourseSectionsTimestamp',
  COURSE_NAMES: 'courseNames',
  COURSE_NAMES_TIMESTAMP: 'courseNamesTimestamp',
  USER_DATA: 'userData',
  USER_DATA_TIMESTAMP: 'userDataTimestamp',
}

/**
 * Clear all course-related cache
 */
export const clearCourseCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.ALL_SECTIONS)
    localStorage.removeItem(CACHE_KEYS.ALL_SECTIONS_TIMESTAMP)
    localStorage.removeItem(CACHE_KEYS.COURSE_NAMES)
    localStorage.removeItem(CACHE_KEYS.COURSE_NAMES_TIMESTAMP)
    console.log('Course cache cleared')
  } catch (error) {
    console.error('Error clearing course cache:', error)
  }
}

/**
 * Check if cache is still valid
 */
export const isCacheValid = (timestampKey: string, duration: number = CACHE_DURATION): boolean => {
  try {
    const timestamp = localStorage.getItem(timestampKey)
    if (!timestamp) return false
    
    const age = Date.now() - parseInt(timestamp)
    return age < duration
  } catch (error) {
    console.error('Error checking cache validity:', error)
    return false
  }
}

/**
 * Get cached data if valid
 */
export const getCachedData = <T>(dataKey: string, timestampKey: string): T | null => {
  try {
    if (!isCacheValid(timestampKey)) return null
    
    const cachedData = localStorage.getItem(dataKey)
    if (!cachedData) return null
    
    return JSON.parse(cachedData) as T
  } catch (error) {
    console.error('Error getting cached data:', error)
    return null
  }
}

/**
 * Set cached data with timestamp
 */
export const setCachedData = <T>(dataKey: string, timestampKey: string, data: T): void => {
  try {
    localStorage.setItem(dataKey, JSON.stringify(data))
    localStorage.setItem(timestampKey, Date.now().toString())
  } catch (error) {
    console.error('Error setting cached data:', error)
  }
}

/**
 * Get cache age in minutes
 */
export const getCacheAge = (timestampKey: string): number => {
  try {
    const timestamp = localStorage.getItem(timestampKey)
    if (!timestamp) return Infinity
    
    const age = Date.now() - parseInt(timestamp)
    return Math.floor(age / 60000) // Convert to minutes
  } catch (error) {
    console.error('Error getting cache age:', error)
    return Infinity
  }
}
