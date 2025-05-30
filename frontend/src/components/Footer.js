import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full py-2 bg-white border-t border-gray-200">
      <div className="px-4 flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Developed by{' '}
          <a
            href="https://nlp.inesctec.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0091BE] hover:text-[#007aa3] transition-colors font-medium"
          >
            NLP&IR Research Group at INESC TEC
          </a>
        </p>
        <div className="text-xs text-gray-500 space-x-4">
          <Link
            href="/rules"
            className="text-[#0091BE] hover:text-[#007aa3] transition-colors font-medium"
          >
            Rules
          </Link>
          <a
            href="https://arxiv.org/abs/2502.14394"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0091BE] hover:text-[#007aa3] transition-colors font-medium"
          >
            Paper
          </a>
          <a
            href="https://github.com/hmosousa/temporal_game_demo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0091BE] hover:text-[#007aa3] transition-colors font-medium"
          >
            Code
          </a>
        </div>
      </div>
    </footer>
  )
} 