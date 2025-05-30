'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Footer from '../../components/Footer'
import FileUpload from '../../components/FileUpload'
import TextHighlighter from '../../components/TextHighlighter'

export default function Annotate() {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [fileEntities, setFileEntities] = useState({}) // Store entities per file

  // Helper function to process text and entities with DCT
  const processFileWithDCT = (fileData) => {
    let processedText = fileData.text
    let processedEntities = [...(fileData.entities || [])]

    if (fileData.dct) {
      const dctPrefix = `Document creation time: ${fileData.dct}\n`
      const dctOffset = dctPrefix.length
      
      // Prepend DCT to text
      processedText = dctPrefix + fileData.text
      
      // Adjust all existing entity offsets
      processedEntities = processedEntities.map(entity => ({
        ...entity,
        start: entity.start + dctOffset,
        end: entity.end + dctOffset
      }))
      
      // Add DCT as an entity
      const dctStartPos = 'Document creation time: '.length
      const dctEndPos = dctStartPos + fileData.dct.length
      const dctEntity = {
        start: dctStartPos,
        end: dctEndPos,
        text: fileData.dct,
        type: 'instant',
        id: 'dct-' + Date.now(),
        isDCT: true // Mark as DCT entity
      }
      
      processedEntities.unshift(dctEntity) // Add DCT entity at the beginning
    }

    return {
      text: processedText,
      entities: processedEntities
    }
  }

  // Pre-load sample.json when component mounts
  useEffect(() => {
    const sampleFileData = {
      dct: "10/30/89",
      text: "Hewlett-Packard Co. said it raised its stake in Octel Communications Corp. to 8.5% of the common shares outstanding.",
      entities: [
        {
          start: 20,
          end: 24,
          text: "said",
          type: "interval",
          id: 1
        }
      ]
    }

    const processed = processFileWithDCT(sampleFileData)
    
    const sampleFile = {
      name: "sample.json",
      size: 0,
      type: "application/json",
      data: {
        ...sampleFileData,
        processedText: processed.text,
        processedEntities: processed.entities
      },
      uploadedAt: new Date().toISOString(),
      isSystemFile: true
    }
    
    setUploadedFiles([sampleFile])
    
    // Initialize entities for sample file
    setFileEntities({
      "sample.json": processed.entities
    })
  }, [])

  const handleFilesUploaded = useCallback((files) => {
    const processedFiles = files.map(file => {
      const processed = processFileWithDCT(file.data)
      return {
        ...file,
        data: {
          ...file.data,
          processedText: processed.text,
          processedEntities: processed.entities
        }
      }
    })
    
    setUploadedFiles(prev => [...prev, ...processedFiles])
    setShowUpload(false)
    
    // Initialize entities for new files
    const newFileEntities = {}
    processedFiles.forEach(file => {
      // Add IDs to existing entities if they don't have them
      const entitiesWithIds = file.data.processedEntities.map((entity, idx) => ({
        ...entity,
        id: entity.id || Date.now() + idx
      }))
      newFileEntities[file.name] = entitiesWithIds
    })
    
    setFileEntities(prev => ({ ...prev, ...newFileEntities }))
    
    if (processedFiles.length > 0) {
      setCurrentFile(processedFiles[0])
    }
  }, [])

  const handleFileSelect = (file) => {
    setCurrentFile(file)
  }

  const handleDeleteFile = (fileToDelete) => {
    if (fileToDelete.isSystemFile) return // Don't allow deleting system files
    
    setUploadedFiles(prev => prev.filter(file => file !== fileToDelete))
    
    // Clean up entities for deleted file
    setFileEntities(prev => {
      const updated = { ...prev }
      delete updated[fileToDelete.name]
      return updated
    })
    
    if (currentFile === fileToDelete) {
      setCurrentFile(null)
    }
  }

  const handleEntitiesChange = useCallback((newEntities) => {
    if (!currentFile) return
    
    setFileEntities(prev => ({
      ...prev,
      [currentFile.name]: newEntities
    }))
  }, [currentFile])

  const getCurrentEntities = () => {
    if (!currentFile) return []
    return fileEntities[currentFile.name] || []
  }

  const exportAnnotations = () => {
    if (!currentFile) return

    const entities = getCurrentEntities()
    
    // Convert back to original text offsets for export
    let exportEntities = [...entities]
    let originalText = currentFile.data.text
    
    if (currentFile.data.dct) {
      const dctPrefix = `Document creation time: ${currentFile.data.dct}\n`
      const dctOffset = dctPrefix.length
      
      // Remove DCT entity and adjust offsets back
      exportEntities = entities
        .filter(entity => !entity.isDCT) // Remove DCT entity
        .map(entity => ({
          start: entity.start - dctOffset,
          end: entity.end - dctOffset,
          text: entity.text,
          type: entity.type
        }))
    } else {
      exportEntities = entities.map(entity => ({
        start: entity.start,
        end: entity.end,
        text: entity.text,
        type: entity.type
      }))
    }

    const exportData = {
      filename: currentFile.name,
      text: originalText,
      dct: currentFile.data.dct,
      entities: exportEntities,
      annotated_at: new Date().toISOString(),
      total_entities: exportEntities.length
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `annotated_${currentFile.name.replace('.json', '')}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
                    {uploadedFiles.map((file, index) => {
                      const fileEntityCount = (fileEntities[file.name] || []).length
                      return (
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
                                    {fileEntityCount} entities • {file.data.text?.length || 0} chars
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
                      )
                    })}
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
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Annotating: {currentFile.name}
                      </h2>
                      <div className="flex gap-2">
                        <div className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm">
                          {getCurrentEntities().length} entities
                        </div>
                        <button 
                          onClick={exportAnnotations}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          📥 Export
                        </button>
                      </div>
                    </div>

                    {/* Text Highlighter Component */}
                    <TextHighlighter
                      text={currentFile.data.processedText || currentFile.data.text}
                      entities={getCurrentEntities()}
                      onEntitiesChange={handleEntitiesChange}
                      dct={null} // Don't pass DCT since it's now part of the text
                    />
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