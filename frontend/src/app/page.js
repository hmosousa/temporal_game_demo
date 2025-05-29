'use client'

import Link from 'next/link'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl w-full">
          <h1 className="text-6xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">
            Temporal Game
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            A new approach to temporal relation extraction.
          </p>
          
          <div className="flex gap-8 justify-center flex-wrap">
            <Link 
              href="/game" 
              className="inline-block px-10 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl hover:bg-green-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-md w-40 text-center"
            >
              Game
            </Link>
            <Link 
              href="/annotate" 
              className="inline-block px-10 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl hover:bg-green-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 shadow-md w-40 text-center"
            >
              Annotate
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
