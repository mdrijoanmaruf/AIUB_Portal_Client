import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-gray-100  py-4">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-600 font-semibold">
          Developed by{' '}
          <a
            href="https://rijoan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold"
          >
            Md Rijoan Maruf
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer