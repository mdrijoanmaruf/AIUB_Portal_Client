'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FaBook, FaClipboardList, FaChartBar, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa'

const Navbar = () => {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('userData')
    router.push('/')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navigateToCourses = () => {
    router.push('/courses')
    setIsMenuOpen(false) // Close menu on mobile after navigation
  }

  const navigateToGradeReport = () => {
    router.push('/grade-report')
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-md border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <button 
            onClick={() => router.push('/home')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
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
              <h2 className="text-lg font-bold text-blue-600">AIUB Portal</h2>
            </div>
          </button>

          {/* Middle - Nav Items */}
          <div className="hidden md:flex items-center gap-1 md:gap-2">
            <button 
              onClick={navigateToCourses}
              className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
            >
              <FaBook className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Courses</span>
            </button>
            <button className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">
              <FaClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Registration</span>
            </button>
            <button 
              onClick={navigateToGradeReport}
              className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
            >
              <FaChartBar className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Grade Report</span>
            </button>
          </div>

          {/* Right - Settings & Logout */}
          <div className="hidden md:flex items-center gap-2">
            <button className="p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">
              <FaCog className="w-5 h-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
          >
            {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-blue-100 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button 
                onClick={navigateToCourses}
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
              >
                <FaBook className="w-5 h-5" />
                <span className="text-sm font-medium">Courses</span>
              </button>
              <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">
                <FaClipboardList className="w-5 h-5" />
                <span className="text-sm font-medium">Registration</span>
              </button>
              <button 
                onClick={navigateToGradeReport}
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
              >
                <FaChartBar className="w-5 h-5" />
                <span className="text-sm font-medium">Grade Report</span>
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200">
                <FaCog className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar