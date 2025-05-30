'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const TextHighlighter = ({ text, entities = [], onEntitiesChange, dct = null }) => {
  const [hoveredEntity, setHoveredEntity] = useState(null)
  const [editingEntity, setEditingEntity] = useState(null)
  const textRef = useRef(null)

  // Sort entities by start position for proper rendering
  const sortedEntities = [...entities].sort((a, b) => a.start - b.start)

  const handleMouseUp = useCallback(() => {
    if (!textRef.current) return

    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const textContainer = textRef.current

    // Check if selection is within our text container
    if (!textContainer.contains(range.commonAncestorContainer)) return

    // Get the text content and calculate offsets
    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) return

    // Calculate character offsets relative to the original text
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(textContainer)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    const start = preCaretRange.toString().length

    const end = start + selectedText.length

    // Check for overlapping entities
    const overlapping = entities.some(entity => 
      (start < entity.end && end > entity.start)
    )

    if (overlapping) {
      alert('Cannot create entity: overlaps with existing entity')
      selection.removeAllRanges()
      return
    }

    // Directly create the entity with default 'interval' type
    const newEntity = {
      start: start,
      end: end,
      text: selectedText,
      type: 'interval', // Default to interval
      id: Date.now() // Simple ID generation
    }

    onEntitiesChange([...entities, newEntity])
    selection.removeAllRanges()
  }, [entities, onEntitiesChange])

  const updateEntity = (entityId, updates) => {
    const updatedEntities = entities.map(entity =>
      entity.id === entityId ? { ...entity, ...updates } : entity
    )
    onEntitiesChange(updatedEntities)
    setEditingEntity(null)
  }

  const deleteEntity = (entityId) => {
    const updatedEntities = entities.filter(entity => entity.id !== entityId)
    onEntitiesChange(updatedEntities)
    setHoveredEntity(null)
  }

  const renderTextWithEntities = () => {
    if (sortedEntities.length === 0) {
      return <span>{text}</span>
    }

    const segments = []
    let currentIndex = 0

    sortedEntities.forEach((entity, idx) => {
      // Add text before entity
      if (currentIndex < entity.start) {
        segments.push(
          <span key={`text-${idx}`}>
            {text.substring(currentIndex, entity.start)}
          </span>
        )
      }

      // Add highlighted entity
      const entityText = entity.text || text.substring(entity.start, entity.end)
      const isHovered = hoveredEntity === entity.id
      const isEditing = editingEntity === entity.id

      // Determine entity styling based on type and whether it's DCT
      let entityClass = 'relative inline-block px-1 rounded cursor-pointer transition-all '
      if (entity.isDCT) {
        entityClass += 'bg-green-200 border-b-2 border-green-400'
      } else if (entity.type === 'instant') {
        entityClass += 'bg-purple-200 border-b-2 border-purple-400'
      } else {
        entityClass += 'bg-blue-200 border-b-2 border-blue-400'
      }
      
      if (isHovered) {
        entityClass += ' shadow-lg scale-105'
      }

      segments.push(
        <span
          key={`entity-${entity.id || idx}`}
          className={entityClass}
          onMouseEnter={() => setHoveredEntity(entity.id)}
          onMouseLeave={() => setHoveredEntity(null)}
          onClick={(e) => {
            e.stopPropagation()
            setEditingEntity(entity.id)
          }}
        >
          {entityText}
          
          {/* Entity tooltip */}
          {isHovered && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
              {entity.isDCT ? 'DCT' : entity.type} ({entity.start}-{entity.end})
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          )}

          {/* Delete button on hover - but not for DCT entities */}
          {isHovered && !entity.isDCT && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteEntity(entity.id)
              }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          )}
        </span>
      )

      currentIndex = entity.end
    })

    // Add remaining text
    if (currentIndex < text.length) {
      segments.push(
        <span key="text-end">
          {text.substring(currentIndex)}
        </span>
      )
    }

    return segments
  }

  return (
    <div className="space-y-4">
      {/* Text Display Area */}
      <div className="bg-white border rounded-lg p-6 relative">
        {/* Info button */}
        <div className="absolute top-4 right-4 group">
          <button className="w-6 h-6 text-blue-600 rounded-full flex items-center justify-center text-sm hover:text-blue-800 transition-colors">
            ⓘ
          </button>
          {/* Tooltip */}
          <div className="absolute right-0 top-8 w-64 p-3 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
            Select text with your mouse to automatically create entities (defaults to 'interval'). Click on highlighted entities to edit their type or position.
            <div className="absolute -top-1 right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
          </div>
        </div>

        <div
          ref={textRef}
          className="text-gray-800 leading-relaxed select-text cursor-text whitespace-pre-wrap"
          onMouseUp={handleMouseUp}
          style={{ userSelect: 'text' }}
        >
          {renderTextWithEntities()}
        </div>
      </div>

      {/* Edit Entity Dialog */}
      {editingEntity && (
        <EntityEditDialog
          entity={entities.find(e => e.id === editingEntity)}
          text={text}
          onUpdate={(updates) => updateEntity(editingEntity, updates)}
          onCancel={() => setEditingEntity(null)}
          onDelete={() => deleteEntity(editingEntity)}
        />
      )}

    </div>
  )
}

// Entity Edit Dialog Component
const EntityEditDialog = ({ entity, text, onUpdate, onCancel, onDelete }) => {
  const [type, setType] = useState(entity.type)
  const [start, setStart] = useState(entity.start)
  const [end, setEnd] = useState(entity.end)

  const entityText = text.substring(start, end)

  const handleSave = () => {
    if (start >= end) {
      alert('Start position must be less than end position')
      return
    }
    if (start < 0 || end > text.length) {
      alert('Position out of text bounds')
      return
    }

    onUpdate({
      type,
      start: parseInt(start),
      end: parseInt(end),
      text: entityText,
      isDCT: entity.isDCT // Preserve DCT flag
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Edit {entity.isDCT ? 'DCT' : 'Entity'}
        </h3>
        
        {entity.isDCT && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-sm text-green-700">
            📅 <strong>Document Creation Time:</strong> This is a special entity representing when the document was created.
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={entity.isDCT} // DCT should remain as instant
            >
              <option value="interval">Interval</option>
              <option value="instant">Instant</option>
            </select>
            {entity.isDCT && (
              <p className="text-xs text-gray-500 mt-1">DCT entities are always instants</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Position
              </label>
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max={text.length}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Position
              </label>
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max={text.length}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Preview
            </label>
            <div className="bg-gray-100 p-3 rounded border text-sm">
              "{entityText}"
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          {!entity.isDCT && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this entity?')) {
                  onDelete()
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextHighlighter 