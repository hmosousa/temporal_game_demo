'use client'

import Link from 'next/link'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Floating Rules Button */}
      <Link 
        href="/rules" 
        className="absolute top-6 right-6 z-10 px-4 py-2 bg-[#0091BE] text-white rounded-lg hover:bg-[#007aa3] transition-colors text-sm font-medium shadow-lg"
      >
        📖 Rules
      </Link>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl w-full px-8">
          <h1 className="text-6xl font-bold text-[#000000] mb-4 text-gradient-blue text-center">
            Temporal Game
          </h1>
          <p className="text-xl text-gray-700 mb-12 leading-relaxed text-center">
            A new approach to temporal relation extraction
          </p>
          
          <div className="flex gap-6 justify-center flex-wrap">
            <Link 
              href="/game" 
              className="btn-primary w-40 text-center block"
            >
              Game
            </Link>
            <Link 
              href="/annotate" 
              className="btn-primary w-40 text-center block"
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
