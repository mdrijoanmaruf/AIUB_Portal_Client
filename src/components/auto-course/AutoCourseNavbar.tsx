import React from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import Image from 'next/image'

interface AutoCourseNavbarProps {
  onBackClick: () => void
}

const AutoCourseNavbar: React.FC<AutoCourseNavbarProps> = ({ onBackClick }) => {
  return (
    <nav className="bg-white shadow-md border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Image
                src="/aiub.svg"
                alt="AIUB Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden md:block">
              <span className="text-lg font-semibold text-gray-800">AIUB Portal</span>
            </div>
          </div>

          {/* Right - Back Button */}
          <button
            onClick={onBackClick}
            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 rounded-lg shadow-sm"
          >
            <FiArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline text-sm">Back to Sections</span>
            <span className="sm:hidden text-sm">Back</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AutoCourseNavbar