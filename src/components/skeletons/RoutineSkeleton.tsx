import React from 'react'

export default function RoutineSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="w-48 h-5 bg-gray-200 rounded" />
                <div className="w-32 h-3 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Routine summary / controls skeleton */}
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-1/3 h-10 bg-gray-200 rounded" />
          <div className="w-full sm:w-1/3 h-10 bg-gray-200 rounded" />
          <div className="w-full sm:w-1/3 h-10 bg-gray-200 rounded" />
        </div>

        {/* Grid / list of routine placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-gray-200 rounded" />
                  <div className="w-1/2 h-3 bg-gray-200 rounded" />
                  <div className="flex gap-2 mt-3">
                    <div className="h-8 w-20 bg-gray-200 rounded" />
                    <div className="h-8 w-16 bg-gray-200 rounded" />
                    <div className="h-8 w-10 bg-gray-200 rounded ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
