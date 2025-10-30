/**
 * PrefetchIndicator Component
 * Shows a subtle notification when data is being prefetched in the background
 */

'use client'

import { useEffect, useState } from 'react'
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'

interface PrefetchIndicatorProps {
  show: boolean
  status: 'loading' | 'success' | 'partial' | 'hidden'
  cached?: string[]
  failed?: string[]
}

export default function PrefetchIndicator({ show, status, cached = [], failed = [] }: PrefetchIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show && status !== 'hidden') {
      setVisible(true)
      
      // Auto-hide success message after 3 seconds
      if (status === 'success' || status === 'partial') {
        const timer = setTimeout(() => {
          setVisible(false)
        }, 3000)
        
        return () => clearTimeout(timer)
      }
    } else {
      setVisible(false)
    }
  }, [show, status])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`
        backdrop-blur-xl rounded-xl border shadow-lg px-4 py-3 max-w-sm
        ${status === 'loading' ? 'bg-blue-50/90 border-blue-200/50' : ''}
        ${status === 'success' ? 'bg-emerald-50/90 border-emerald-200/50' : ''}
        ${status === 'partial' ? 'bg-amber-50/90 border-amber-200/50' : ''}
      `}>
        <div className="flex items-start gap-3">
          {status === 'loading' && (
            <FaSpinner className="w-5 h-5 text-blue-600 animate-spin mt-0.5 shrink-0" />
          )}
          {(status === 'success' || status === 'partial') && (
            <FaCheckCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
              status === 'success' ? 'text-emerald-600' : 'text-amber-600'
            }`} />
          )}
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold mb-1 ${
              status === 'loading' ? 'text-blue-700' : 
              status === 'success' ? 'text-emerald-700' : 
              'text-amber-700'
            }`}>
              {status === 'loading' && 'Preparing your data...'}
              {status === 'success' && 'All data ready!'}
              {status === 'partial' && 'Data partially ready'}
            </p>
            
            {(status === 'success' || status === 'partial') && cached.length > 0 && (
              <p className="text-xs text-gray-600">
                ✓ {cached.join(', ')}
              </p>
            )}
            
            {status === 'partial' && failed.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ✗ {failed.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
