'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar/Navbar'
import Loading from '../home/loading'
import Footer from '@/components/Footer/Footer'
import { motion } from 'framer-motion'
import { cacheManager, initAutoLogout } from '@/lib/cacheManager'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'

interface Transaction {
  date: string
  particulars: string
  debit: string
  credit: string
  vat: string
  balance: string
  isSemesterFee: boolean
  type: 'debit' | 'credit'
}

interface FinancialSummary {
  totalDebit: string
  totalCredit: string
  totalVat: string
  balance: string
}

interface FinanceData {
  transactions: Transaction[]
  summary: FinancialSummary
  timestamp: string
}

const Finance = () => {
  const router = useRouter()
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all')

  useEffect(() => {
    // Initialize cache management and auto logout
    initAutoLogout(router)
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get auth token from localStorage
      const token = localStorage.getItem('authToken')

      if (!token) {
        // No token, redirect to login
        router.push('/')
        return
      }

      // Check if data is cached with new cache manager
      const cachedFinanceData = cacheManager.getCache('financeData')
      
      if (cachedFinanceData && cachedFinanceData.transactions) {
        console.log('Using cached finance data')
        setFinanceData(cachedFinanceData)
        setLoading(false)
        return
      }

      // Fetch fresh data if no valid cache
      console.log('Fetching fresh finance data from server')
      const response = await fetch(`${API_BASE}/finance/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success && result.data) {
        setFinanceData(result.data)

        // Cache the finance data with 5-minute expiry
        try {
          cacheManager.setCache('financeData', result.data, {
            maxAge: 5 * 60 * 1000, // 5 minutes
            onExpiry: () => {
              console.log('Finance data cache expired - logging out')
              cacheManager.autoLogout()
            }
          })
        } catch (error) {
          console.error('Error caching finance data:', error)
        }
      } else {
        // Token invalid or expired, redirect to login
        localStorage.removeItem('authToken')
        router.push('/')
      }
    } catch (err: any) {
      console.error('Error fetching finance data:', err)
      setError('Failed to load finance data')
      // Redirect to login on error
      localStorage.removeItem('authToken')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  if (error || !financeData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 via-white to-pink-50">
        <div className="text-center bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-red-200 shadow-lg">
          <svg className="w-20 h-20 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 text-lg font-medium">{error || 'No finance data found'}</p>
          <p className="text-gray-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Filter transactions
  const filteredTransactions = financeData.transactions.filter(transaction => {
    const matchesSearch = transaction.particulars.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.date.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || transaction.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Financial Details
              </h1>
              <p className="text-sm sm:text-base text-gray-600">View your complete transaction history and account balance</p>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div 
              className="bg-linear-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Debit</p>
                  <p className="text-2xl font-bold text-gray-900">৳{financeData.summary.totalDebit}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Credit</p>
                  <p className="text-2xl font-bold text-gray-900">৳{financeData.summary.totalCredit}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900">৳{financeData.summary.balance}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div 
          className="mb-6 flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-gray-600 focus:border-blue-400 focus:outline-none text-sm sm:text-base"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('debit')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filterType === 'debit'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300'
              }`}
            >
              Debits
            </button>
            <button
              onClick={() => setFilterType('credit')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                filterType === 'credit'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300'
              }`}
            >
              Credits
            </button>
          </div>
        </motion.div>

        {/* Transactions Table */}
        <motion.div 
          className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-linear-to-r from-blue-100/80 to-indigo-100/80 border-b-2 border-blue-200 px-6 py-4">
            <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Transaction History
              <span className="text-sm font-normal text-blue-600">({filteredTransactions.length} transactions)</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Particulars</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Debit</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Credit</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction, index) => (
                  <motion.tr 
                    key={index} 
                    className={`hover:bg-gray-50 transition-colors ${
                      transaction.isSemesterFee ? 'bg-blue-50/30' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {transaction.date}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        {transaction.isSemesterFee && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded self-start sm:self-auto">
                            Semester Fee
                          </span>
                        )}
                        <span className="truncate">{transaction.particulars}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                      {transaction.debit !== '0.00' && (
                        <span className="font-bold text-red-600">৳{transaction.debit}</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                      {transaction.credit !== '0.00' && (
                        <span className="font-bold text-emerald-600">৳{transaction.credit}</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-700">
                      ৳{transaction.balance}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                    
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-right font-bold text-red-600">
                    ৳{financeData.summary.totalDebit}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-right font-bold text-emerald-600">
                    ৳{financeData.summary.totalCredit}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-right font-bold text-blue-700">
                    ৳{financeData.summary.balance}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <motion.div 
              className="text-center py-12 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Your financial transactions will appear here.'}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}

export default Finance