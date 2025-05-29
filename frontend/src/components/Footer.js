export default function Footer() {
  return (
    <footer className="w-full py-2 bg-white">
      <div className="px-4 flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Developed by{' '}
          <a
            href="https://nlp.inesctec.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            NLP&IR Research Group at INESC TEC
          </a>
        </p>
        <div className="text-xs text-gray-500 space-x-4">
          <a
            href="https://arxiv.org/abs/2502.14394"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            Paper
          </a>
          <a
            href="https://huggingface.co/liaad/PtVId"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            Model
          </a>
          <a
            href="https://github.com/liaad/portuguese_vid"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            Code
          </a>
        </div>
      </div>
    </footer>
  )
} 