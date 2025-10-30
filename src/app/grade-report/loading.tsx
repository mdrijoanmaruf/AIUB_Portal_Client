export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar Skeleton */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="relative bg-gray-200 rounded-xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-lg"></div>
              <div>
                <div className="w-48 h-6 bg-gray-300 rounded mb-2"></div>
                <div className="w-64 h-4 bg-gray-300 rounded hidden sm:block"></div>
              </div>
            </div>
            <div className="flex gap-3 sm:gap-4 bg-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 self-start sm:self-auto">
              <div className="w-16 h-8 bg-gray-400 rounded"></div>
              <div className="w-16 h-8 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex animate-pulse">
            <div className="flex-1 px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded"></div>
                <div className="w-16 h-3 bg-gray-300 rounded hidden xs:inline sm:inline"></div>
                <div className="w-12 h-3 bg-gray-300 rounded xs:hidden sm:hidden"></div>
              </div>
            </div>
            <div className="flex-1 px-2 sm:px-4 py-3 sm:py-4 border-l border-r border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded"></div>
                <div className="w-20 h-3 bg-gray-300 rounded hidden xs:inline sm:inline"></div>
                <div className="w-16 h-3 bg-gray-300 rounded xs:hidden sm:hidden"></div>
              </div>
            </div>
            <div className="flex-1 px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded"></div>
                <div className="w-12 h-3 bg-gray-300 rounded hidden xs:inline sm:inline"></div>
                <div className="w-10 h-3 bg-gray-300 rounded xs:hidden sm:hidden"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton - Analytics Tab */}
        <div className="space-y-8">
          {/* Performance Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg shadow-lg p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                </div>
                <div className="w-12 h-6 bg-gray-300 rounded mb-1"></div>
                <div className="w-20 h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>

          {/* GPA Trend Chart Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="w-48 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Grade Performance Trend Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="w-56 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="w-full h-80 bg-gray-100 rounded animate-pulse"></div>
          </div>

          {/* Two Column Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <div className="w-40 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
              <div className="w-44 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Courses per Semester Skeleton */}
          <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
            <div className="w-44 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
            <div className="w-full h-72 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
