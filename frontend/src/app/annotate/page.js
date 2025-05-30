'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Footer from '../../components/Footer'
import FileUpload from '../../components/FileUpload'

export default function Annotate() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  // Pre-load sample.json when component mounts
  useEffect(() => {
    const sampleFile = {
      name: "sample.json",
      size: 0,
      type: "application/json",
      data: {
        dct: "10/30/89",
        text: "Hewlett-Packard Co. said it raised its stake in Octel Communications Corp. to 8.5% of the common shares outstanding.",
        entities: [
          {
            start: 53,
            end: 57,
            text: "said",
            type: "interval"
          }
        ]
      },
      uploadedAt: new Date().toISOString(),
      isSystemFile: true
    }
    setUploadedFiles([sampleFile])
  }, [])

  const handleFilesUploaded = useCallback((files) => {
    setUploadedFiles(prev => [...prev, ...files])
    setShowUpload(false)
    if (files.length > 0) {
      setCurrentFile(files[0])
    }
  }, [])

  const handleFileSelect = (file) => {
    setCurrentFile(file)
  }

  const handleDeleteFile = (fileToDelete) => {
    if (fileToDelete.isSystemFile) return // Don't allow deleting system files
    
    setUploadedFiles(prev => prev.filter(file => file !== fileToDelete))
    if (currentFile === fileToDelete) {
      setCurrentFile(null)
    }
  }

  const generateSampleFile = () => {
    const sampleData = {
      dct: "2024-01-15T10:30:00",
      text: "The meeting was scheduled for yesterday at 3 PM. John arrived early and waited for an hour before the other participants showed up. The discussion lasted until evening, and they agreed to meet again next week.",
      entities: [
        {
          start: 32,
          end: 41,
          text: "yesterday",
          type: "interval"
        },
        {
          start: 45,
          end: 50,
          text: "3 PM",
          type: "instant"
        },
        {
          start: 52,
          end: 56,
          text: "John",
          type: "interval"
        },
        {
          start: 65,
          end: 70,
          text: "early",
          type: "interval"
        },
        {
          start: 87,
          end: 94,
          text: "an hour",
          type: "interval"
        },
        {
          start: 158,
          end: 165,
          text: "evening",
          type: "interval"
        },
        {
          start: 198,
          end: 207,
          text: "next week",
          type: "interval"
        }
      ]
    }

    const dataStr = JSON.stringify(sampleData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample_annotation_file.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center mb-8 gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              ← Home
            </Link>
            <h1 className="text-3xl font-semibold text-dark text-center flex-1 pb-4 border-b border-gray-200">
              Annotation Tool
            </h1>
          </div>

          {/* Main Layout with Sidebar */}
          <div className="flex gap-6 min-h-[600px]">
            {/* Left Sidebar - File List */}
            <div className="w-80 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Files</h2>
                  <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    + Add
                  </button>
                </div>
                
                {/* Upload Interface */}
                {showUpload && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <button
                        onClick={generateSampleFile}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        📥 Download Sample
                      </button>
                      <FileUpload onFilesUploaded={handleFilesUploaded} />
                    </div>
                  </div>
                )}
              </div>

              {/* File List */}
              <div className="p-4">
                {uploadedFiles.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No files uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentFile === file 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-xs">📄</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 truncate text-sm">
                                  {file.name}
                                  {file.isSystemFile && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                      Sample
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {file.data.entities?.length || 0} entities • {file.data.text?.length || 0} chars
                                </p>
                              </div>
                            </div>
                          </div>
                          {!file.isSystemFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFile(file)
                              }}
                              className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 transition-opacity"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center Content Area */}
            <div className="flex-1">
              {!currentFile ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a file to start annotating</h3>
                    <p className="text-gray-600">
                      Choose a file from the sidebar or upload a new one to begin temporal relation annotation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Annotating: {currentFile.name}
                      </h2>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                          Settings
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                          Export
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                      <p className="text-yellow-700">
                        🚧 Annotation interface coming soon! This will include entity highlighting, 
                        temporal board, and dynamic annotation modes.
                      </p>
                    </div>
                    
                    {/* File Preview */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-700 mb-3">Text Content:</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-800 leading-relaxed">
                            {currentFile.data.dct && (
                              <span className="text-blue-600 font-medium">
                                Document creation time: {currentFile.data.dct}
                                <br /><br />
                              </span>
                            )}
                            {currentFile.data.text}
                          </p>
                        </div>
                      </div>
                      
                      {currentFile.data.entities && currentFile.data.entities.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-700 mb-3">
                            Entities ({currentFile.data.entities.length}):
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto">
                            <div className="grid gap-3">
                              {currentFile.data.entities.map((entity, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border">
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      "{entity.text || currentFile.data.text.substring(entity.start, entity.end)}"
                                    </span>
                                    <div className="text-sm text-gray-500 mt-1">
                                      Position: {entity.start}-{entity.end} • Type: {entity.type || 'interval'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      (entity.type || 'interval') === 'instant' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {entity.type || 'interval'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
} 