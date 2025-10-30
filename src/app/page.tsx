'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    // username: '',
    username: '23-53347-3',
    password: '',
    captcha: '',
    captchaToken: '',
    sessionCookies: ''
  })
  const [captchaImage, setCaptchaImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load captcha on component mount
  useEffect(() => {
    loadCaptcha()
  }, [])

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true)
      setError('')
      
      const response = await fetch(`${API_BASE}/captcha`)
      const data = await response.json()
      
      if (data.success) {
        setCaptchaImage(data.data.imageUrl)
        setFormData(prev => ({ 
          ...prev, 
          captchaToken: data.data.token, 
          sessionCookies: data.data.sessionCookies || '', 
          captcha: '' 
        }))
      } else {
        throw new Error(data.message)
      }
    } catch (err: any) {
      setError('Failed to load captcha. Please refresh.')
      console.error('Captcha load error:', err)
    } finally {
      setCaptchaLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password || !formData.captcha) {
      setError('Please fill in all fields')
      return
    }

    if (!formData.captchaToken) {
      setError('Captcha token is missing. Please refresh the captcha.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('Login successful! Redirecting...')
        
        // Store JWT token and user data in localStorage
        if (result.data) {
          if (result.data.token) {
            localStorage.setItem('authToken', result.data.token)
          }
          // Store user data with timestamp for caching
          const { token, ...userDataWithoutToken } = result.data
          localStorage.setItem('userData', JSON.stringify(userDataWithoutToken))
          localStorage.setItem('userDataTimestamp', Date.now().toString())
        }
        
        setTimeout(() => {
          router.push('/home')
        }, 1000)
      } else {
        throw new Error(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
      loadCaptcha() // Reload captcha on error
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-blue-50 p-4 overflow-hidden">
      {/* Animated Dotted Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(59,130,246,0.15)_1px,transparent_0)] bg-size-[40px_40px] animate-[moveGrid_20s_linear_infinite]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(37,99,235,0.1)_1px,transparent_0)] bg-size-[60px_60px] animate-[moveGrid_30s_linear_infinite_reverse]"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-16 left-8 w-16 h-16 bg-blue-200 rounded-full opacity-20 blur-xl animate-float"></div>
      <div className="absolute bottom-16 right-8 w-24 h-24 bg-blue-300 rounded-full opacity-20 blur-xl animate-float-delayed"></div>

      <div className="relative w-full max-w-3xl z-10">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100 flex flex-col md:flex-row">
          {/* Left Side - Logo and Text */}
          <div className="bg-blue-600 px-4 py-6 text-center relative flex flex-col justify-center md:w-1/2">
            <div className="absolute inset-0 bg-blue-700 opacity-10"></div>
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Image src="/aiub.svg" alt="AIUB Logo" width={64} height={64} className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">Student Portal</h1>
              <p className="text-blue-100 text-xs">American International University-Bangladesh</p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="px-4 py-6 space-y-4 flex flex-col justify-center md:w-1/2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                    placeholder="Enter your student ID"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-10 py-2.5 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Captcha Field */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Security Verification
                </label>
                
                {/* Captcha Image */}
                <div className="mb-2 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <div className="flex-1 flex items-center justify-center bg-white border border-blue-200 rounded-lg min-h-[50px] overflow-hidden">
                    {captchaLoading ? (
                      <div className="text-blue-500 text-xs flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                    ) : captchaImage ? (
                      <Image src={captchaImage} alt="Captcha" width={150} height={60} className="max-w-full h-auto" />
                    ) : (
                      <div className="text-gray-400 text-xs">No captcha</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    disabled={captchaLoading}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    title="Refresh Captcha"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="captcha"
                    name="captcha"
                    value={formData.captcha}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                    placeholder="Enter captcha code"
                  />
                </div>
              </div>

              {/* Login Error Message - positioned before login button */}
              {error && (
                <div className="text-center">
                  <p className="text-red-600 text-sm font-medium mb-2 flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-3 py-2 rounded-lg flex items-start">
                  <svg className="w-4 h-4 mr-2 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || captchaLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-600/30 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login to Portal
                  </>
                )}
              </button>

              {/* Course Planner Button */}
              <button
                type="button"
                onClick={() => router.push('/course-routine')}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Access Course Planner
              </button>

              
            </form>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes moveGrid {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(40px, 40px);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
