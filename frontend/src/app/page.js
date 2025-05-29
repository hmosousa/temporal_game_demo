'use client'

import Link from 'next/link'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl w-full">
          <h1 className="text-6xl font-bold text-[#000000] mb-4 text-gradient-blue">
            Temporal Game
          </h1>
          <p className="text-xl text-gray-700 mb-12 leading-relaxed">
            A new approach to temporal relation extraction.
          </p>
          
          <div className="flex gap-8 justify-center flex-wrap">
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
