'use client'

import { useState, useCallback, useRef } from 'react'

const FileUpload = ({ onFilesUploaded }) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)

  const validateJsonFile = (file, content) => {
    const errors = []
    
    try {
      const data = JSON.parse(content)
      
      // Check required field
      if (!data.text || typeof data.text !== 'string') {
        errors.push('Missing or invalid "text" field (required)')
      }
      
      // Validate DCT if present
      if (data.dct && typeof data.dct !== 'string') {
        errors.push('Invalid "dct" field - must be a string')
      }
      
      // Validate entities if present
      if (data.entities) {
        if (!Array.isArray(data.entities)) {
          errors.push('Invalid "entities" field - must be an array')
        } else {
          data.entities.forEach((entity, idx) => {
            if (typeof entity.start !== 'number' || typeof entity.end !== 'number') {
              errors.push(`Entity ${idx + 1}: "start" and "end" must be numbers`)
            }
            if (entity.start >= entity.end) {
              errors.push(`Entity ${idx + 1}: "start" must be less than "end"`)
            }
            if (entity.start < 0 || entity.end > data.text.length) {
              errors.push(`Entity ${idx + 1}: offsets out of text bounds`)
            }
            if (entity.type && !['interval', 'instant'].includes(entity.type)) {
              errors.push(`Entity ${idx + 1}: type must be "interval" or "instant"`)
            }
          })
        }
      }
      
      return { isValid: errors.length === 0, errors, data }
    } catch (e) {
      return { 
        isValid: false, 
        errors: [`Invalid JSON format: ${e.message}`], 
        data: null 
      }
    }
  }

  const validateTextFile = (file, content) => {
    if (!content.trim()) {
      return {
        isValid: false,
        errors: ['Text file is empty'],
        data: null
      }
    }

    return {
      isValid: true,
      errors: [],
      data: {
        text: content.trim(),
        entities: []
      }
    }
  }

  const processFiles = useCallback(async (files) => {
    setUploading(true)
    setErrors([])
    
    const validFiles = []
    const allErrors = []

    for (const file of files) {
      try {
        const content = await readFileContent(file)
        const isJsonFile = file.name.toLowerCase().endsWith('.json')
        const isTextFile = file.name.toLowerCase().match(/\.(txt|text)$/)

        let validation
        if (isJsonFile) {
          validation = validateJsonFile(file, content)
        } else if (isTextFile) {
          validation = validateTextFile(file, content)
        } else {
          validation = {
            isValid: false,
            errors: ['Unsupported file type. Please upload .json or .txt files'],
            data: null
          }
        }

        if (validation.isValid) {
          validFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            data: validation.data,
            uploadedAt: new Date().toISOString()
          })
        } else {
          allErrors.push({
            fileName: file.name,
            errors: validation.errors
          })
        }
      } catch (error) {
        allErrors.push({
          fileName: file.name,
          errors: [`Failed to read file: ${error.message}`]
        })
      }
    }

    setErrors(allErrors)
    setUploading(false)

    if (validFiles.length > 0) {
      onFilesUploaded(validFiles)
    }
  }, [onFilesUploaded])

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    }
  }, [processFiles])

  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      processFiles(files)
    }
  }, [processFiles])

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-3">
      {/* Compact Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.txt,.text"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 text-sm">Processing...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-2xl">📁</div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragActive ? 'Drop here' : 'Drop files'}
              </p>
              <button
                onClick={openFileDialog}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Choose Files
              </button>
            </div>
            <p className="text-xs text-gray-500">
              JSON & TXT files
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-800 text-sm">Errors:</h4>
          {errors.map((error, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-500 p-2 rounded">
              <p className="font-medium text-red-800 text-xs">{error.fileName}</p>
              <ul className="mt-1 text-xs text-red-700 space-y-0.5">
                {error.errors.map((err, errIndex) => (
                  <li key={errIndex}>• {err}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload 