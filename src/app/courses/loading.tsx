import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-700 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Search / controls skeleton */}
        <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-64 h-10 bg-gray-200 rounded" />
          <div className="w-32 h-10 bg-gray-200 rounded ml-auto" />
        </div>

        {/* Grid of course placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-200 rounded" />
                <div className="h-8 w-20 bg-gray-200 rounded" />
                <div className="h-8 w-8 bg-gray-200 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
