import Link from 'next/link'

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold text-[#0091BE] hover:text-[#007aa3] transition-colors">
          Temporal Game
        </Link>
        <Link 
          href="/rules" 
          className="px-4 py-2 bg-[#0091BE] text-white rounded-lg hover:bg-[#007aa3] transition-colors text-sm font-medium"
        >
          📖 Rules
        </Link>
      </div>
    </header>
  )
} 