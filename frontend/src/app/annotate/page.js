'use client'

import Link from 'next/link'
import Footer from '../../components/Footer'

export default function Annotate() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center mb-8 gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-semibold text-gray-800 text-center flex-1 pb-4 border-b border-gray-200">
              Annotation Tool
            </h1>
          </div>

          <div className="text-center p-8 bg-gray-100 rounded-lg mt-8">
            <p className="mb-4 text-lg text-gray-600">The annotation tool is coming soon!</p>
            <p className="text-lg text-gray-600">This will allow you to manually annotate temporal relations in text.</p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
} 