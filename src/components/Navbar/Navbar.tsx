'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { FaBook, FaClipboardList, FaChartBar, FaSignOutAlt, FaBars, FaTimes, FaHome } from 'react-icons/fa'

const Navbar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('authToken')
    router.push('/')
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navigationItems = [
    { path: '/home', label: 'Home', icon: FaHome },
    { path: '/courses', label: 'Courses', icon: FaBook },
    { path: '/registration', label: 'Registration', icon: FaClipboardList },
    { path: '/grade-report', label: 'Grade Report', icon: FaChartBar },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-blue-100/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-3 hover:scale-105 transition-transform duration-200 group"
          >
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Image
                src="/aiub.svg"
                alt="AIUB Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden md:block">
              <h2 className="text-lg font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AIUB Portal
              </h2>
            </div>
          </button>

          {/* Middle - Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 shadow-md'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right - Logout Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
            >
              {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-blue-100 bg-white/95 backdrop-blur-md relative z-50">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 touch-manipulation ${
                      isActive(item.path)
                        ? 'text-blue-600 bg-blue-50 shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive(item.path) && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                )
              })}

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  )
}

export default Navbar