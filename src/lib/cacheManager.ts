/**
 * Cache Management Utility
 * Handles automatic cache expiry and logout after 5 minutes
 */

export interface CacheConfig {
  maxAge?: number; // Cache duration in milliseconds (default: 5 minutes)
  onExpiry?: () => void; // Callback when cache expires
}

class CacheManager {
  private static instance: CacheManager;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Set cache with automatic expiry
   */
  setCache(key: string, data: any, config: CacheConfig = {}): void {
    const { maxAge = this.DEFAULT_MAX_AGE, onExpiry } = config;
    
    try {
      // Store data with timestamp
      const cacheData = {
        data,
        timestamp: Date.now(),
        maxAge
      };
      
      localStorage.setItem(key, JSON.stringify(cacheData));
      localStorage.setItem(`${key}Timestamp`, Date.now().toString());
      
      // Clear existing timer for this key
      this.clearTimer(key);
      
      // Set new expiry timer
      const timer = setTimeout(() => {
        this.clearCache(key);
        if (onExpiry) {
          onExpiry();
        }
      }, maxAge);
      
      this.timers.set(key, timer);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Get cache if not expired
   */
  getCache(key: string): any | null {
    try {
      const cachedItem = localStorage.getItem(key);
      const timestampItem = localStorage.getItem(`${key}Timestamp`);
      
      if (!cachedItem || !timestampItem) {
        return null;
      }
      
      const cacheData = JSON.parse(cachedItem);
      const timestamp = parseInt(timestampItem);
      const age = Date.now() - timestamp;
      
      // Check if cache is expired
      if (age >= (cacheData.maxAge || this.DEFAULT_MAX_AGE)) {
        this.clearCache(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Clear specific cache
   */
  clearCache(key: string): void {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}Timestamp`);
      this.clearTimer(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all app caches and logout
   */
  clearAllCaches(): void {
    try {
      // Clear all timers
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();
      
      // Clear all localStorage items related to the app
      const keysToRemove = [
        'userData',
        'userDataTimestamp',
        'authToken',
        'registrationData',
        'registrationTimestamp',
        'gradeReportData',
        'gradeReportTimestamp',
        'financeData',
        'financeTimestamp',
        'allCourseSections',
        'allCourseSectionsTimestamp',
        'courseNames',
        'courseNamesTimestamp'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }

  /**
   * Auto logout after cache expiry
   */
  autoLogout(): void {
    this.clearAllCaches();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  /**
   * Initialize cache management for a page
   */
  initPageCache(router: any): void {
    // Set up auto logout after 5 minutes
    const autoLogoutTimer = setTimeout(() => {
      this.autoLogout();
    }, this.DEFAULT_MAX_AGE);

    // Store the timer for cleanup
    this.timers.set('autoLogout', autoLogoutTimer);

    // Reset timer on user activity
    const resetTimer = () => {
      this.clearTimer('autoLogout');
      const newTimer = setTimeout(() => {
        this.autoLogout();
      }, this.DEFAULT_MAX_AGE);
      this.timers.set('autoLogout', newTimer);
    };

    // Listen for user activity
    if (typeof window !== 'undefined') {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });
    }
  }

  /**
   * Clear timer for specific key
   */
  private clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * Check if auth token is still valid
   */
  isAuthValid(): boolean {
    const token = localStorage.getItem('authToken');
    const userData = this.getCache('userData');
    
    return !!(token && userData);
  }

  /**
   * Refresh cache timestamp (extend expiry)
   */
  refreshCache(key: string): void {
    const cachedItem = localStorage.getItem(key);
    if (cachedItem) {
      localStorage.setItem(`${key}Timestamp`, Date.now().toString());
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Helper functions for common cache operations
export const setCacheWithExpiry = (key: string, data: any, config?: CacheConfig) => {
  cacheManager.setCache(key, data, config);
};

export const getCacheWithExpiry = (key: string) => {
  return cacheManager.getCache(key);
};

export const clearAllAppCaches = () => {
  cacheManager.clearAllCaches();
};

export const initAutoLogout = (router: any) => {
  cacheManager.initPageCache(router);
};