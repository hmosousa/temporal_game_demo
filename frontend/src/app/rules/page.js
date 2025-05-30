'use client'

import Link from 'next/link'
import Footer from '../../components/Footer'

export default function Rules() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center mb-8 gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-semibold text-dark text-center flex-1 pb-4 border-b border-gray-200">
              How to Play
            </h1>
            <Link 
              href="/game" 
              className="px-4 py-2 bg-[#0091BE] text-white rounded-lg hover:bg-[#007aa3] transition-colors text-sm"
            >
              Play Game →
            </Link>
          </div>

          {/* Rules Content */}
          <div className="space-y-8">
            
            {/* Game Overview */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">🎯 Game Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Temporal Game is about understanding and annotating <strong>temporal relations</strong> between entities in text. 
                The goal is to correctly identify how different entities relate to each other in time by classifying the relation between their start and end points.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-800 font-medium">
                  <strong>Objective:</strong> Annotate temporal relations between entity endpoints to create a coherent timeline without contradictions.
                </p>
              </div>
            </section>

            {/* Understanding the Interface */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">🖥️ Interface</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-dark mb-2">1. Text</h3>
                  <p className="text-gray-700 mb-2">
                    The top section shows a text passage with <span className="bg-yellow-200 px-1 rounded">highlighted entities</span>. 
                    Each entity represents an event or temporal expression that has a beginning and end in time.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-dark mb-2">2. Temporal Board</h3>
                  <p className="text-gray-700 mb-3">
                    Below the text, you'll see a temporal board. This board represents all possible relations between 
                    the start and end points of entities tagged in the text.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-dark mb-2">Grid Structure:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><strong>Rows & Columns:</strong> Each represents an entity endpoint: start or end. The start of an entity is prepended with a s and the end with an e. The color in the row and column match the one in the tagged text.</li>
                      <li><strong>Cells:</strong> When clicking on a cell of the board a pop will show up to select the relation between two endpoints.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Relation Types */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">⏰ Temporal Relations</h2>
              
              <p className="text-gray-700 mb-4">
                There are four types of temporal relations you can assign:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-blue-600 mr-2">&lt;</span>
                    <h3 className="font-semibold text-dark">Before</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    A happens before B.
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    Example: "start breakfast &lt; start lunch"
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-green-600 mr-2">&gt;</span>
                    <h3 className="font-semibold text-dark">After</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    A happens after B.
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    Example: "end dinner &gt; end lunch"
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-purple-600 mr-2">=</span>
                    <h3 className="font-semibold text-dark">Equal</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    A and B happen at the same time.
                  </p>
                  <div className="mt-2 text-xs text-gray-600">
                    Example: "start meeting = start talking"
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl font-bold text-gray-600 mr-2">-</span>
                    <h3 className="font-semibold text-dark">Unknown</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    The relation cannot be determined from the text.
                  </p>
                </div>
              </div>
            </section>

            {/* How to Play */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">🎮 How to Play</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <h3 className="font-medium text-dark">Read the Text</h3>
                    <p className="text-gray-700 text-sm">Read the passage and identify the highlighted temporal entities.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <h3 className="font-medium text-dark">Click a Cell</h3>
                    <p className="text-gray-700 text-sm">Click on any cell in the temporal board to select the relation between two endpoints you want to annotate.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <h3 className="font-medium text-dark">Choose a Relation</h3>
                    <p className="text-gray-700 text-sm">Select the appropriate temporal relation (&lt;, &gt;, =, or -) from the popup.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  <div>
                    <h3 className="font-medium text-dark">Continue Annotating</h3>
                    <p className="text-gray-700 text-sm">Repeat until you've made all the annotations you want, or until the game ends.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Scoring and Winning */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">🏆 Game End</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-dark mb-2">Game Over Conditions</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>✅ Success:</strong> You win the game if you produce a timeline that is coherent.</li>
                    <li><strong>❌ Temporal incoherent:</strong> The game ends if you create an incoherent timeline. For instance, if A before B, B before C, but C before A.</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* Strategy Tips */}
            <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-dark mb-4">💡 Strategy Tips</h2>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">💭</span>
                  <p className="text-gray-700 text-sm"><strong>Read Carefully:</strong> Pay attention to temporal indicators like "before", "after", "during", "while", etc.</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">🔄</span>
                  <p className="text-gray-700 text-sm"><strong>Use Undo:</strong> Made a mistake? Use the Undo button to reverse your last action.</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-purple-500 text-xl">❓</span>
                  <p className="text-gray-700 text-sm"><strong>When Uncertain:</strong> Use the "Unknown" (-) relation when the text doesn't provide clear temporal information.</p>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 text-xl">🎯</span>
                  <p className="text-gray-700 text-sm"><strong>Start Simple:</strong> Begin with 2 entities and work your way up to more complex scenarios.</p>
                </div>
              </div>
            </section>

            {/* Ready to Play */}
            <section className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white text-center">
              <h2 className="text-2xl font-semibold mb-4">Ready to Play? 🚀</h2>
              <p className="mb-6 text-blue-100">
                Now that you understand the rules, it's time to put your temporal reasoning skills to the test!
              </p>
              <Link 
                href="/game" 
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Playing
              </Link>
            </section>

          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
} 