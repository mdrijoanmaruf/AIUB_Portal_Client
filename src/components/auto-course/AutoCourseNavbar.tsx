import React from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import Image from 'next/image'

interface AutoCourseNavbarProps {
  onBackClick: () => void
}

const AutoCourseNavbar: React.FC<AutoCourseNavbarProps> = ({ onBackClick }) => {
  return (
    <nav className="bg-white shadow-md border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left - Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Image
                src="/aiub.svg"
                alt="AIUB Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-base sm:text-lg font-semibold text-gray-800">AIUB Portal</span>
            </div>
          </div>

          {/* Right - Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 rounded-lg shadow-sm text-xs sm:text-sm"
          >
            <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="hidden sm:inline">Back to Sections</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AutoCourseNavbar